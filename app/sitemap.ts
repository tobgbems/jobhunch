import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE = "https://thejobhunch.com";

function staticEntries(): MetadataRoute.Sitemap {
  const weekly = { changeFrequency: "weekly" as const, priority: 0.8 };
  return [
    { url: `${SITE}/`, ...weekly, priority: 1 },
    { url: `${SITE}/companies`, ...weekly },
    { url: `${SITE}/jobs`, ...weekly },
    { url: `${SITE}/login`, ...weekly },
    { url: `${SITE}/signup`, ...weekly },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticEntries();

  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("companies").select("slug");

    if (error) {
      console.error("[sitemap] companies fetch failed:", error.message);
      return entries;
    }

    const slugs = (data ?? [])
      .map((row) => row.slug)
      .filter((slug): slug is string => Boolean(slug));

    const companyEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: `${SITE}/company/${slug}`,
      changeFrequency: "daily",
      priority: 0.75,
    }));

    const { data: jobRows, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("status", "open");

    if (jobsError) {
      console.error("[sitemap] jobs fetch failed:", jobsError.message);
      return [...entries, ...companyEntries];
    }

    const jobIds = (jobRows ?? [])
      .map((row) => row.id)
      .filter((id): id is string => Boolean(id));

    const jobEntries: MetadataRoute.Sitemap = jobIds.map((id) => ({
      url: `${SITE}/jobs/${id}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...entries, ...companyEntries, ...jobEntries];
  } catch (e) {
    console.error("[sitemap] unexpected error:", e);
    return entries;
  }
}
