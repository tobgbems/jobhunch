import { createClient } from "@/lib/supabase/server";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const initialFullName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  const avatarUrl =
    profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? "";

  const nameForInitials =
    initialFullName.trim() ||
    (user.email?.split("@")[0] ?? "U");
  const initials = nameForInitials
    .split(/\s+/)
    .map((part: string) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ProfileSettings
      email={user.email ?? null}
      initialFullName={initialFullName}
      avatarUrl={avatarUrl}
      initials={initials || "U"}
    />
  );
}
