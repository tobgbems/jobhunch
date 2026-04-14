"""
Scrape Nigerian job boards and upsert into Supabase `jobs`.
Uses apply_url as dedupe key; closes stale non-manual listings after 14 days.
"""

from __future__ import annotations

import html as html_lib
import json
import logging
import os
import re
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 JobHunchBot/1.0"
)
REQUEST_TIMEOUT = 30
REQUEST_DELAY_SEC = 1.5
MAX_INDEX_PAGES = 3
MAX_JOBS_PER_SOURCE = 35
STALE_DAYS = 14

ALLOWED_JOB_TYPES = frozenset({"full-time", "part-time", "contract", "remote"})
ALLOWED_CATEGORIES = [
    "technology",
    "software",
    "engineering",
    "product",
    "design",
    "marketing",
    "sales",
    "finance",
    "accounting",
    "banking",
    "human resources",
    "operations",
    "consulting",
    "data",
    "analytics",
    "media",
    "communications",
    "legal",
    "healthcare management",
    "project management",
    "customer success",
    "ecommerce",
]
BLOCKED_TITLE_KEYWORDS = [
    "driver",
    "chef",
    "cook",
    "cleaner",
    "hairdresser",
    "stylist",
    "security guard",
    "tailor",
    "mechanic",
    "plumber",
    "electrician",
]
RESPONSIBILITIES_HEADER_KEYWORDS = (
    "responsibil",
    "duties",
    "what you will do",
    "role overview",
    "key task",
)
REQUIREMENTS_HEADER_KEYWORDS = (
    "requirement",
    "qualification",
    "skills",
    "what we are looking for",
    "experience",
    "competenc",
)


def normalize_apply_url(url: str) -> str:
    """Strip fragments and trivial query noise for stable dedupe."""
    parsed = urlparse(url.strip())
    cleaned = parsed._replace(fragment="")
    return urlunparse(cleaned)


def fetch_html(session: requests.Session, url: str) -> str | None:
    try:
        r = session.get(url, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        return r.text
    except requests.RequestException as e:
        logger.warning("Request failed for %s: %s", url, e)
        return None


def polite_sleep() -> None:
    time.sleep(REQUEST_DELAY_SEC)


def html_to_plain_text(html: str) -> str:
    if not html:
        return ""
    decoded = html_lib.unescape(html)
    soup = BeautifulSoup(decoded, "html.parser")
    # If a source later hides details behind JS-only readmore widgets, switch this
    # extraction path to a rendered-browser fetch (Playwright/Selenium/Apify).
    text = soup.get_text(separator="\n", strip=True)
    return text.strip()


def normalize_lines(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if line:
            lines.append(line)
    return lines


def is_section_header(line: str) -> bool:
    if len(line) > 100:
        return False
    if line.endswith(":"):
        return True
    letters = [c for c in line if c.isalpha()]
    if not letters:
        return False
    upper_letters = sum(1 for c in letters if c.isupper())
    return upper_letters / len(letters) >= 0.85


def format_description_text(raw_text: str) -> str:
    lines = normalize_lines(raw_text)
    if not lines:
        return ""
    formatted: list[str] = []
    for line in lines:
        if not formatted:
            formatted.append(line)
            continue
        if is_section_header(line):
            if formatted[-1] != "":
                formatted.append("")
            formatted.append(line)
            formatted.append("")
            continue
        if formatted[-1] == "":
            formatted.append(line)
        else:
            formatted[-1] = f"{formatted[-1]} {line}"
    while formatted and formatted[0] == "":
        formatted.pop(0)
    while formatted and formatted[-1] == "":
        formatted.pop()
    return "\n".join(formatted)


def split_sectioned_text(formatted_text: str) -> tuple[str, str | None]:
    if not formatted_text:
        return "", None
    paragraphs = [p.strip() for p in formatted_text.split("\n\n") if p.strip()]
    if not paragraphs:
        return formatted_text, None

    responsibilities_parts: list[str] = []
    requirements_parts: list[str] = []
    current = "responsibilities"
    found_requirements = False

    for para in paragraphs:
        heading = para.splitlines()[0].lower()
        if any(k in heading for k in RESPONSIBILITIES_HEADER_KEYWORDS):
            current = "responsibilities"
            responsibilities_parts.append(para)
            continue
        if any(k in heading for k in REQUIREMENTS_HEADER_KEYWORDS):
            current = "requirements"
            found_requirements = True
            requirements_parts.append(para)
            continue
        if current == "requirements":
            requirements_parts.append(para)
        else:
            responsibilities_parts.append(para)

    if not responsibilities_parts:
        responsibilities_parts = paragraphs
    responsibilities = "\n\n".join(responsibilities_parts).strip()
    requirements = "\n\n".join(requirements_parts).strip() if found_requirements and requirements_parts else None
    return responsibilities, requirements


def extract_category_text(job_posting: dict[str, Any], soup: BeautifulSoup) -> str:
    parts: list[str] = []
    for key in ("industry", "occupationalCategory", "keywords", "jobCategory"):
        value = job_posting.get(key)
        if isinstance(value, list):
            parts.extend(str(v).strip() for v in value if str(v).strip())
        elif value:
            parts.append(str(value).strip())

    labels = ("industry", "category", "sector")
    for li in soup.find_all("li"):
        label = li.find("span", class_=re.compile(r"jkey-title", re.I))
        info = li.find("span", class_=re.compile(r"jkey-info", re.I))
        if label and info and any(tag in label.get_text(strip=True).lower() for tag in labels):
            val = info.get_text(" ", strip=True)
            if val:
                parts.append(val)
    return " | ".join(parts)


def title_blocked(title: str) -> bool:
    low_title = title.lower()
    return any(keyword in low_title for keyword in BLOCKED_TITLE_KEYWORDS)


def category_allowed(category_text: str) -> bool:
    low_category = category_text.lower()
    return any(term in low_category for term in ALLOWED_CATEGORIES)


def map_employment_type(raw: str | None) -> str:
    if not raw:
        return "full-time"
    u = raw.upper().replace(" ", "_").replace("-", "_")
    if "FULL" in u or u == "FULL_TIME":
        return "full-time"
    if "PART" in u or u == "PART_TIME":
        return "part-time"
    if "CONTRACT" in u or "TEMP" in u:
        return "contract"
    if "REMOTE" in u:
        return "remote"
    low = raw.lower()
    if low in ALLOWED_JOB_TYPES:
        return low
    return "full-time"


def jobberman_index_urls(session: requests.Session) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for page in range(1, MAX_INDEX_PAGES + 1):
        url = "https://www.jobberman.com/jobs" if page == 1 else f"https://www.jobberman.com/jobs?page={page}"
        polite_sleep()
        html = fetch_html(session, url)
        if not html:
            break
        for m in re.finditer(
            r'href="(https://www\.jobberman\.com/listings/[^"#?\s]+)"',
            html,
        ):
            u = normalize_apply_url(m.group(1))
            if u not in seen:
                seen.add(u)
                found.append(u)
        for m in re.finditer(r'href="(/listings/[^"#?\s]+)"', html):
            u = normalize_apply_url(urljoin("https://www.jobberman.com", m.group(1)))
            if u not in seen:
                seen.add(u)
                found.append(u)
        if page >= MAX_INDEX_PAGES:
            break
    return found[:MAX_JOBS_PER_SOURCE]


def jobberman_graph_by_id(graph: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {item["@id"]: item for item in graph if isinstance(item, dict) and "@id" in item}


def parse_jobberman_detail(session: requests.Session, listing_url: str) -> dict[str, Any] | None:
    polite_sleep()
    html = fetch_html(session, listing_url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    job_posting: dict[str, Any] | None = None
    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text() or ""
        raw = raw.strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and data.get("@type") == "JobPosting":
            job_posting = data
            break
        if isinstance(data, dict) and "@graph" in data:
            graph = data["@graph"]
            if isinstance(graph, list):
                for item in graph:
                    if isinstance(item, dict) and item.get("@type") == "JobPosting":
                        job_posting = item
                        break
                if job_posting:
                    by_id = jobberman_graph_by_id(graph)
                    job_posting["_graph_index"] = by_id
                    break
    if not job_posting:
        logger.warning("Jobberman: no JobPosting JSON-LD for %s", listing_url)
        return None

    title = (job_posting.get("title") or "").strip() or "Untitled role"
    desc_html = job_posting.get("description") or ""
    description_raw = html_to_plain_text(desc_html)
    description = format_description_text(description_raw)
    responsibilities, requirements = split_sectioned_text(description)

    hiring = job_posting.get("hiringOrganization")
    company_name = "Unknown employer"
    if isinstance(hiring, dict):
        if hiring.get("name"):
            company_name = str(hiring["name"]).strip()
        elif "@id" in hiring:
            idx = job_posting.get("_graph_index") or {}
            ref = idx.get(hiring["@id"])
            if isinstance(ref, dict) and ref.get("name"):
                company_name = str(ref["name"]).strip()

    loc = job_posting.get("jobLocation") or {}
    location = ""
    if isinstance(loc, dict):
        addr = loc.get("address")
        if isinstance(addr, dict):
            parts = [
                addr.get("streetAddress"),
                addr.get("addressLocality"),
                addr.get("addressRegion"),
                addr.get("addressCountry"),
            ]
            location = ", ".join(str(p).strip() for p in parts if p)
    if not location:
        location = "Nigeria"

    emp = job_posting.get("employmentType")
    if isinstance(emp, list):
        emp = emp[0] if emp else None
    job_type = map_employment_type(str(emp) if emp else None)

    posted_raw = job_posting.get("datePosted") or job_posting.get("datePublished")
    posted_at = parse_iso_date(posted_raw)
    category = extract_category_text(job_posting, soup)

    return {
        "title": title[:500],
        "company_name": company_name[:300],
        "location": location[:200] or "Nigeria",
        "job_type": job_type,
        "description": description,
        "responsibilities": responsibilities,
        "requirements": requirements,
        "category": category,
        "apply_url": normalize_apply_url(listing_url),
        "posted_at": posted_at,
        "source": "jobberman",
    }


def parse_iso_date(raw: str | None) -> str:
    """Return ISO8601 date string (YYYY-MM-DD) for posted_at column."""
    if not raw:
        return date.today().isoformat()
    s = raw.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
        return dt.date().isoformat()
    except ValueError:
        return date.today().isoformat()


def myjobmag_index_paths(session: requests.Session) -> list[str]:
    paths: list[str] = []
    seen: set[str] = set()
    base = "https://www.myjobmag.com"
    for page in range(1, MAX_INDEX_PAGES + 1):
        url = f"{base}/jobs" if page == 1 else f"{base}/jobs/page/{page}"
        polite_sleep()
        html = fetch_html(session, url)
        if not html:
            break
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.select('a[href^="/job/"]'):
            href = a.get("href") or ""
            if "/job-descriptions" in href:
                continue
            path = href.split("?", 1)[0]
            if path not in seen:
                seen.add(path)
                paths.append(path)
        if len(paths) >= MAX_JOBS_PER_SOURCE:
            break
    return paths[:MAX_JOBS_PER_SOURCE]


def parse_myjobmag_detail(session: requests.Session, path: str) -> dict[str, Any] | None:
    base = "https://www.myjobmag.com"
    job_url = normalize_apply_url(urljoin(base, path))
    polite_sleep()
    html = fetch_html(session, job_url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    job_posting: dict[str, Any] | None = None
    for script in soup.find_all("script", type="application/ld+json"):
        raw = (script.string or script.get_text() or "").strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and data.get("@type") == "JobPosting":
            job_posting = data
            break
    if not job_posting:
        logger.warning("MyJobMag: no JobPosting JSON-LD for %s", job_url)
        return None

    title = (job_posting.get("title") or "").strip() or "Untitled role"
    desc_html = html_lib.unescape(job_posting.get("description") or "")
    description_raw = html_to_plain_text(desc_html)
    description = format_description_text(description_raw)
    responsibilities, requirements = split_sectioned_text(description)

    org = job_posting.get("hiringOrganization") or {}
    company_name = "Unknown employer"
    if isinstance(org, dict) and org.get("name"):
        company_name = str(org["name"]).strip()

    location = ""
    loc = job_posting.get("jobLocation") or {}
    if isinstance(loc, dict):
        addr = loc.get("address")
        if isinstance(addr, dict):
            parts = [addr.get("addressLocality"), addr.get("addressRegion"), addr.get("addressCountry")]
            location = ", ".join(str(p).strip() for p in parts if p)
    if not location:
        for li in soup.find_all("li"):
            label = li.find("span", class_="jkey-title")
            if label and "location" in label.get_text(strip=True).lower():
                info = li.find("span", class_="jkey-info")
                if info:
                    location = info.get_text(strip=True)
                break

    emp = job_posting.get("employmentType")
    job_type = map_employment_type(str(emp) if emp else None)

    posted_at = parse_iso_date(job_posting.get("datePosted"))
    category = extract_category_text(job_posting, soup)

    return {
        "title": title[:500],
        "company_name": company_name[:300],
        "location": (location or "Nigeria")[:200],
        "job_type": job_type,
        "description": description,
        "responsibilities": responsibilities,
        "requirements": requirements,
        "category": category,
        "apply_url": job_url,
        "posted_at": posted_at,
        "source": "myjobmag",
    }


def scrape_jobberman(session: requests.Session) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    urls = jobberman_index_urls(session)
    logger.info("Jobberman: %d listing URLs from index", len(urls))
    for listing_url in urls:
        row = parse_jobberman_detail(session, listing_url)
        if row:
            rows.append(row)
    return rows


def scrape_myjobmag(session: requests.Session) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    paths = myjobmag_index_paths(session)
    logger.info("MyJobMag: %d job paths from index", len(paths))
    for path in paths:
        row = parse_myjobmag_detail(session, path)
        if row:
            rows.append(row)
    return rows


def dedupe_by_apply_url(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_url: dict[str, dict[str, Any]] = {}
    for r in rows:
        u = r.get("apply_url")
        if not u:
            continue
        by_url[u] = r
    return list(by_url.values())


def rows_for_supabase(rows: list[dict[str, Any]], now_iso: str) -> list[dict[str, Any]]:
    out = []
    for r in rows:
        jt = r["job_type"]
        if jt not in ALLOWED_JOB_TYPES:
            jt = "full-time"
        out.append(
            {
                "company_name": r["company_name"],
                "title": r["title"],
                "location": r.get("location"),
                "job_type": jt,
                "description": r.get("description") or None,
                "responsibilities": r.get("responsibilities") or None,
                "requirements": r.get("requirements") or None,
                "apply_url": r["apply_url"],
                "source": r["source"],
                "is_scraped": True,
                "status": "open",
                "posted_at": r.get("posted_at"),
                "last_seen_at": now_iso,
            }
        )
    return out


def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise SystemExit(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env or CI secrets)."
        )
    return create_client(url, key)


def main() -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    all_rows: list[dict[str, Any]] = []
    try:
        all_rows.extend(scrape_jobberman(session))
    except Exception as e:
        logger.warning("Jobberman source crashed: %s", e)

    try:
        all_rows.extend(scrape_myjobmag(session))
    except Exception as e:
        logger.warning("MyJobMag source crashed: %s", e)

    scraped_count = len(all_rows)
    all_rows = dedupe_by_apply_url(all_rows)
    skipped_category = 0
    skipped_title = 0
    filtered_rows: list[dict[str, Any]] = []
    for row in all_rows:
        title = row.get("title", "")
        if title_blocked(title):
            skipped_title += 1
            logger.info("Skipping [%s] — title contains blocked keyword", title)
            continue

        category = row.get("category", "")
        if not category_allowed(category):
            skipped_category += 1
            logger.info(
                "Skipping [%s] — category [%s] not in allowed list",
                title,
                category or "Unknown",
            )
            continue
        filtered_rows.append(row)

    all_rows = filtered_rows
    if not all_rows:
        logger.warning("No jobs scraped; skipping upsert.")

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    payload = rows_for_supabase(all_rows, now_iso)

    client = get_supabase()

    inserted = 0
    updated = 0
    if payload:
        urls = [p["apply_url"] for p in payload]
        try:
            existing = (
                client.table("jobs")
                .select("apply_url")
                .in_("apply_url", urls)
                .execute()
            )
            existing_set = {r["apply_url"] for r in (existing.data or [])}
            inserted = sum(1 for u in urls if u not in existing_set)
            updated = sum(1 for u in urls if u in existing_set)
        except Exception as e:
            logger.warning("Could not pre-count inserts/updates: %s", e)
            inserted = 0
            updated = len(payload)

        try:
            client.table("jobs").upsert(payload, on_conflict="apply_url").execute()
        except Exception as e:
            logger.error("Supabase upsert failed: %s", e)
            raise SystemExit(1) from e

    cutoff = (now - timedelta(days=STALE_DAYS)).isoformat()
    deactivated = 0
    try:
        res = (
            client.table("jobs")
            .update({"status": "closed"})
            .neq("source", "manual")
            .lt("last_seen_at", cutoff)
            .eq("status", "open")
            .select("id")
            .execute()
        )
        deactivated = len(res.data or [])
    except Exception as e:
        logger.warning("Stale close pass failed (non-fatal): %s", e)

    print(
        f"Scraped {scraped_count} jobs, inserted/updated {inserted + updated}, "
        f"skipped {skipped_category} (category filter), skipped {skipped_title} (title filter)"
    )


if __name__ == "__main__":
    main()
