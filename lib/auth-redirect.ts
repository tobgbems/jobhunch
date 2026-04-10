/** Safe in-app path after auth; rejects open redirects. */
export function safeNextParam(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/dashboard";
  return trimmed;
}
