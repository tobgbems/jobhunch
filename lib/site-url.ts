/**
 * Canonical public site URL (no trailing slash).
 * Set NEXT_PUBLIC_SITE_URL in .env — production: https://thejobhunch.com, local: http://localhost:3000
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
