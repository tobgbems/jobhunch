/* eslint-disable no-console */
/**
 * One-time migration script: import legacy Bubble review CSV exports.
 *
 * Usage (one-time):
 *   - Place CSVs in:
 *       scripts/data/companies.csv
 *       scripts/data/reviews.csv
 *   - Run:
 *       node scripts/migrate-bubble-reviews.js
 *
 * Notes:
 * - Uses Supabase service role key (bypasses RLS).
 * - DRY_RUN=true will not insert rows, but will still compute counts.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { createClient } = require("@supabase/supabase-js");
const { parse } = require("csv-parse/sync");

const DRY_RUN = false;

const COMPANIES_CSV_PATH = path.join(__dirname, "data", "companies.csv");
const REVIEWS_CSV_PATH = path.join(__dirname, "data", "reviews.csv");

function slugifyCompanyName(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseBubbleDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function clampRating1to5(n) {
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(5, n));
}

function parseRating(starRating) {
  const n = parseInt(String(starRating ?? "").trim(), 10);
  return clampRating1to5(Number.isNaN(n) ? NaN : n);
}

function mapEmploymentStatus(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.startsWith("former")) return "former";
  if (s.startsWith("current")) return "current";
  // Be permissive with unexpected values.
  return null;
}

function mapEmploymentType(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("full")) return "full-time";
  if (s.startsWith("part")) return "part-time";
  if (s.startsWith("contract")) return "contract";
  if (s.startsWith("intern")) return "intern";
  // Store as-is if the DB column is a plain text field.
  return v.trim();
}

function parseIntOrNull(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    let value = t.slice(idx + 1).trim();
    // Strip surrounding quotes.
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function columnExists(supabase, table, column) {
  // Try to select the column; PostgREST will error clearly if it doesn't exist.
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return true;
  const msg = String(error.message ?? error.details ?? error.hint ?? error);
  const colLower = String(column).toLowerCase();
  if (msg.toLowerCase().includes("does not exist") && msg.toLowerCase().includes(colLower)) return false;
  // If PostgREST can’t introspect, surface the error.
  throw new Error(`Failed probing column existence for ${table}.${column}: ${msg}`);
}

function getMissingColumnsSQL(columns) {
  const parts = [];
  if (columns.includes("imported_from_bubble")) {
    parts.push(
      "alter table public.reviews add column if not exists imported_from_bubble boolean not null default false;"
    );
  }
  if (columns.includes("source")) {
    parts.push("alter table public.reviews add column if not exists source text;");
  }

  if (!parts.length) return "";
  return [
    "-- Run this once in Supabase SQL Editor",
    ...parts.map((p) => `-- ${p}`.replace(/--\s*/, "")),
  ].join("\n");
}

async function probeUserIdNullable(supabase, { nameToCompanyId, reviewsRows }) {
  // We probe by attempting a single insert with `user_id = null`.
  // If it succeeds, we delete the test row and return true.
  // If it fails due to NOT NULL on user_id, we return false.
  // Any other error is unexpected and should stop the migration.
  const limitTo = Math.min(reviewsRows.length, 50);
  for (let i = 0; i < limitTo; i++) {
    const row = reviewsRows[i];
    const reviewCompanyName = String(row.company ?? "").trim();
    if (!reviewCompanyName) continue;

    const normalizedCompanyName = normalizeName(reviewCompanyName);
    const companyId = nameToCompanyId.get(normalizedCompanyName);
    if (!companyId) continue;

    const ratingOverall = parseRating(row["star-rating"]);
    if (!ratingOverall) continue;

    const employmentStatus = mapEmploymentStatus(row["user employment status"]);
    if (!employmentStatus) continue;

    const pros = row.pro ? String(row.pro).trim() : "";
    const cons = row.con ? String(row.con).trim() : "";
    if (!pros || !cons) continue; // schema has NOT NULL on pros/cons

    const payload = {
      company_id: companyId,
      user_id: null,
      is_anonymous: true,
      job_title: row["user title at company"] ? String(row["user title at company"]).trim() : null,
      employment_status: employmentStatus,
      rating_overall: ratingOverall,
      rating_culture: ratingOverall,
      rating_management: ratingOverall,
      rating_growth: ratingOverall,
      rating_worklife: ratingOverall,
      pros,
      cons,
      imported_from_bubble: true,
      source: "bubble_migration",
      created_at: parseBubbleDate(row["Creation Date"]) ?? undefined,
    };

    try {
      const { data, error } = await supabase.from("reviews").insert(payload).select("id").single();
      if (error) throw error;
      if (!data?.id) throw new Error("Probe insert returned no id.");

      await supabase.from("reviews").delete().eq("id", data.id);
      console.log("Probed `reviews.user_id` NULLability: allowed");
      return true;
    } catch (e) {
      const msg = String(e?.message ?? e);
      const isUserIdNotNull =
        msg.toLowerCase().includes("user_id") &&
        (msg.toLowerCase().includes("not-null") || msg.toLowerCase().includes("not null"));

      if (isUserIdNotNull) {
        console.log("Probed `reviews.user_id` NULLability: NOT allowed");
        return false;
      }

      // If we got here, it's not a nullability issue; rethrow.
      throw e;
    }
  }

  // If we couldn't find a safe candidate row, fall back to assuming NULL is not allowed.
  console.warn("Could not find a valid sample row to probe `reviews.user_id` nullability; assuming NOT allowed.");
  return false;
}

async function main() {
  loadDotEnvLocal();

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in .env.local.");
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. " +
        "Create a service role key in Supabase and add it to your .env.local."
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (!fs.existsSync(COMPANIES_CSV_PATH)) throw new Error(`Missing CSV: ${COMPANIES_CSV_PATH}`);
  if (!fs.existsSync(REVIEWS_CSV_PATH)) throw new Error(`Missing CSV: ${REVIEWS_CSV_PATH}`);

  // Required review columns (per spec).
  const requiredReviewColumns = ["imported_from_bubble", "source"];
  const missingRequired = [];
  for (const col of requiredReviewColumns) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await columnExists(supabase, "reviews", col);
    if (!ok) missingRequired.push(col);
  }

  if (missingRequired.length) {
    console.error("Your `reviews` table is missing required columns:", missingRequired.join(", "));
    console.error("Run the following SQL in Supabase SQL editor first:\n");
    console.error(
      [
        "alter table public.reviews add column if not exists imported_from_bubble boolean not null default false;",
        "alter table public.reviews add column if not exists source text;",
      ]
        .filter(Boolean)
        .join("\n"),
      "\n"
    );
    process.exit(1);
  }

  // Optional columns: only include if they exist.
  const optionalReviewColumns = ["employment_type", "last_year_of_employment", "title"];
  const reviewHas = {};
  for (const col of optionalReviewColumns) {
    // eslint-disable-next-line no-await-in-loop
    reviewHas[col] = await columnExists(supabase, "reviews", col);
  }

  // Companies columns: probe a few to stay resilient to schema naming.
  const companiesLocationColumn = (await columnExists(supabase, "companies", "location"))
    ? "location"
    : (await columnExists(supabase, "companies", "headquarters"))
      ? "headquarters"
      : null;

  const companiesWebsiteColumn = (await columnExists(supabase, "companies", "website"))
    ? "website"
    : (await columnExists(supabase, "companies", "website_link"))
      ? "website_link"
      : null;

  const companiesAboutColumn = (await columnExists(supabase, "companies", "description"))
    ? "description"
    : (await columnExists(supabase, "companies", "about"))
      ? "about"
      : null;

  const companiesSizeColumn = (await columnExists(supabase, "companies", "company_size"))
    ? "company_size"
    : null;

  const companiesCsvText = fs.readFileSync(COMPANIES_CSV_PATH, "utf8");
  const companiesRows = parse(companiesCsvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const reviewsCsvText = fs.readFileSync(REVIEWS_CSV_PATH, "utf8");
  const reviewsRows = parse(reviewsCsvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const nameToCompanyId = new Map();

  let companiesInserted = 0;
  let companiesSkipped = 0;

  console.log(`Starting import: ${companiesRows.length} companies, ${reviewsRows.length} reviews`);

  // STEP 1: Companies
  for (let i = 0; i < companiesRows.length; i++) {
    const row = companiesRows[i];
    const companyName = String(row.name ?? "").trim();
    if (!companyName) continue;

    const normalized = normalizeName(companyName);
    if (nameToCompanyId.has(normalized)) {
      companiesSkipped++;
      continue;
    }

    const existing = await (async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name")
        .ilike("name", companyName)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    })();

    if (existing?.id) {
      nameToCompanyId.set(normalized, existing.id);
      companiesSkipped++;
      continue;
    }

    const baseSlug = slugifyCompanyName(companyName);
    if (!baseSlug) {
      console.warn(`Skipping company with invalid slug: "${companyName}"`);
      companiesSkipped++;
      continue;
    }

    const payload = {
      name: companyName,
      slug: baseSlug,
      industry: row.industry ? String(row.industry).trim() : null,
    };

    if (companiesLocationColumn) payload[companiesLocationColumn] = row.location ? String(row.location).trim() : null;
    if (companiesWebsiteColumn) payload[companiesWebsiteColumn] = row["website link"] ? String(row["website link"]).trim() : null;
    if (companiesAboutColumn) payload[companiesAboutColumn] = row.about ? String(row.about).trim() : null;
    if (companiesSizeColumn) payload[companiesSizeColumn] = row.size ? String(row.size).trim() : null;

    try {
      if (DRY_RUN) {
        const fakeId = crypto.randomUUID();
        nameToCompanyId.set(normalized, fakeId);
        companiesInserted++;
        console.log(`Inserting company (DRY_RUN): ${companyName}`);
        continue;
      }

      // Ensure unique slug (companies.slug is UNIQUE).
      let slugCandidate = payload.slug;
      for (let attempt = 0; attempt < 25; attempt++) {
        // eslint-disable-next-line no-await-in-loop
        const { data: slugRow, error: slugErr } = await supabase
          .from("companies")
          .select("id")
          .eq("slug", slugCandidate)
          .maybeSingle();
        if (slugErr) throw slugErr;
        if (!slugRow) break;
        slugCandidate = `${baseSlug}-${attempt + 1}`;
      }
      payload.slug = slugCandidate;

      console.log(`Inserting company: ${companyName}`);
      const { data, error } = await supabase.from("companies").insert(payload).select("id").single();
      if (error) throw error;
      if (!data?.id) throw new Error(`Company insert returned no id for "${companyName}".`);

      nameToCompanyId.set(normalized, data.id);
      companiesInserted++;
    } catch (e) {
      console.error(`Failed inserting company "${companyName}":`, e?.message ?? e);
      companiesSkipped++;
    }
  }

  // STEP 2: Reviews
  let reviewsInserted = 0;
  let reviewsSkipped = 0;

  if (!DRY_RUN) {
    const userIdNullable = await probeUserIdNullable(supabase, { nameToCompanyId, reviewsRows });
    if (!userIdNullable) {
      const migrationFilename = `20260330120000_reviews_user_id_nullable.sql`;
      const migrationPath = path.join(process.cwd(), "supabase", "migrations", migrationFilename);

      const sql = [
        "-- Make `reviews.user_id` nullable so we can import anonymous Bubble reviews.",
        "alter table public.reviews alter column user_id drop not null;",
        "-- Refresh PostgREST schema cache so the API sees new constraints immediately.",
        "notify pgrst, 'reload schema';",
        "",
      ].join("\n");

      if (!fs.existsSync(migrationPath)) {
        fs.writeFileSync(migrationPath, sql, "utf8");
        console.log(`Generated migration: ${migrationPath}`);
      } else {
        console.log(`Migration already exists: ${migrationPath}`);
      }

      console.error(
        "Your `public.reviews.user_id` is currently NOT NULL. Please run this SQL once in Supabase SQL editor, then rerun the script:\n\n" +
          "ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;"
      );
      process.exit(1);
    }
  } else {
    console.log("DRY_RUN enabled: skipping `user_id` NULLability probe.");
  }

  for (let i = 0; i < reviewsRows.length; i++) {
    const row = reviewsRows[i];
    const reviewCompanyName = String(row.company ?? "").trim();
    const reviewUniqueId = row["unique id"] ? String(row["unique id"]).trim() : `row#${i + 1}`;

    if (!reviewCompanyName) {
      console.warn(`Skipping review ${reviewUniqueId}: missing company name`);
      reviewsSkipped++;
      continue;
    }

    const normalizedCompanyName = normalizeName(reviewCompanyName);
    const companyId = nameToCompanyId.get(normalizedCompanyName);
    if (!companyId) {
      console.warn(`Skipping review ${reviewUniqueId}: no matching company for "${reviewCompanyName}"`);
      reviewsSkipped++;
      continue;
    }

    const ratingOverall = parseRating(row["star-rating"]);
    if (!ratingOverall) {
      console.warn(`Skipping review ${reviewUniqueId}: invalid star-rating "${row["star-rating"]}"`);
      reviewsSkipped++;
      continue;
    }

    const employmentStatus = mapEmploymentStatus(row["user employment status"]);
    if (!employmentStatus) {
      console.warn(
        `Skipping review ${reviewUniqueId}: invalid employment status "${row["user employment status"]}"`
      );
      reviewsSkipped++;
      continue;
    }

    const payload = {
      company_id: companyId,
      // Legacy Bubble export doesn't include user identity; treat them as anonymous.
      // Per your spec we attempt `user_id: null` first.
      user_id: null,
      is_anonymous: true,
      job_title: row["user title at company"] ? String(row["user title at company"]).trim() : null,
      employment_status: employmentStatus,

      // Your schema requires all rating_* columns; Bubble only has one star rating.
      rating_overall: ratingOverall,
      rating_culture: ratingOverall,
      rating_management: ratingOverall,
      rating_growth: ratingOverall,
      rating_worklife: ratingOverall,

      pros: row.pro ? String(row.pro).trim() : "",
      cons: row.con ? String(row.con).trim() : "",

      created_at: parseBubbleDate(row["Creation Date"]) ?? undefined,

      imported_from_bubble: true,
      source: "bubble_migration",
    };

    // Optional columns: only include if they exist.
    if (reviewHas.employment_type) {
      const v = mapEmploymentType(row["user employment type"]);
      if (v) payload.employment_type = v;
    }
    if (reviewHas.last_year_of_employment) {
      const v = parseIntOrNull(row["user last year of employment"]);
      if (v !== null) payload.last_year_of_employment = v;
    }
    if (reviewHas.title) {
      const v = row.title ? String(row.title).trim() : "";
      if (v) payload.title = v;
    }

    try {
      if (DRY_RUN) {
        console.log(`Inserting review (DRY_RUN): ${reviewUniqueId}`);
        reviewsInserted++;
        continue;
      }

      console.log(`Inserting review: ${reviewUniqueId}`);

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;
      reviewsInserted++;
    } catch (e) {
      console.error(`Failed inserting review ${reviewUniqueId}:`, e?.message ?? e);
      reviewsSkipped++;
    }
  }

  console.log(
    `Summary: ${companiesInserted} companies inserted, ${companiesSkipped} companies skipped; ` +
      `${reviewsInserted} reviews inserted, ${reviewsSkipped} reviews skipped.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Migration script failed:", e?.message ?? e);
    process.exit(1);
  });

