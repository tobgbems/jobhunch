/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BubbleUser = {
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function normalizeWhitespace(input: string | undefined | null) {
  const value = String(input ?? "").replace(/\s+/g, " ").trim();
  return value.length ? value : null;
}

function parseBubbleUsersFromPrompt(): BubbleUser[] {
  const promptPath = path.join(process.cwd(), "cursor_prompt_bubble_user_migration.md");
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Missing prompt file: ${promptPath}`);
  }

  const prompt = fs.readFileSync(promptPath, "utf8");
  const match = prompt.match(/const BUBBLE_USERS = \[([\s\S]*?)\];/);
  if (!match?.[1]) {
    throw new Error("Could not parse BUBBLE_USERS from cursor_prompt_bubble_user_migration.md");
  }

  const arrayText = `[${match[1]}]`;
  const parsed = vm.runInNewContext(arrayText, {});
  if (!Array.isArray(parsed)) {
    throw new Error("Parsed BUBBLE_USERS is not an array.");
  }

  return parsed as BubbleUser[];
}

const BUBBLE_USERS: BubbleUser[] = parseBubbleUsersFromPrompt();

async function columnExists(supabase: SupabaseClient, table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return true;

  const message = String(error.message ?? error.details ?? error.hint ?? error).toLowerCase();
  return !message.includes("does not exist");
}

async function main() {
  loadDotEnvLocal();

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const requiredColumns = ["id", "email", "full_name", "first_name", "last_name", "imported_from_bubble", "source"];
  const missingColumns: string[] = [];
  for (const column of requiredColumns) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await columnExists(supabase, "profiles", column);
    if (!exists) missingColumns.push(column);
  }

  if (missingColumns.length) {
    throw new Error(
      `profiles is missing columns: ${missingColumns.join(", ")}. ` +
        "Apply migration supabase/migrations/20260331110000_profiles_legacy_bubble_linking.sql first."
    );
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of BUBBLE_USERS) {
    const email = normalizeWhitespace(user.email)?.toLowerCase();
    if (!email) {
      skipped += 1;
      continue;
    }

    const firstName = normalizeWhitespace(user.first_name);
    const lastName = normalizeWhitespace(user.last_name);
    const fullName =
      normalizeWhitespace(user.full_name) ??
      normalizeWhitespace([firstName, lastName].filter(Boolean).join(" ")) ??
      email;

    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (findError) {
      failed += 1;
      console.error(`Lookup failed for ${email}:`, findError.message);
      continue;
    }

    if (existing) {
      skipped += 1;
      continue;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: randomUUID(),
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      imported_from_bubble: true,
      source: "bubble",
    });

    if (insertError) {
      failed += 1;
      console.error(`Insert failed for ${email}:`, insertError.message);
      continue;
    }

    inserted += 1;
  }

  console.log("Bubble users migration complete.");
  console.log(`Total in source: ${BUBBLE_USERS.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (already exists/invalid): ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error("Migration script failed:", error);
  process.exit(1);
});
