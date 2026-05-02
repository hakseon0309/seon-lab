import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import SettingsForm from "@/components/settings-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, ownedTeamsRes, membershipsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, ics_url, is_admin, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("teams")
      .select("id, name")
      .eq("created_by", user.id),
    supabase
      .from("team_members")
      .select("team_id, share_schedule, teams(id, name)")
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  const ownedTeams = (ownedTeamsRes.data ?? []) as { id: string; name: string }[];
  const scheduleShareTeams = ((membershipsRes.data ?? []) as {
    team_id: string;
    share_schedule: boolean | null;
    teams: { id: string; name: string } | { id: string; name: string }[] | null;
  }[])
    .map((row) => {
      const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
      return team
        ? {
            id: team.id,
            name: team.name,
            shareSchedule: row.share_schedule ?? true,
          }
        : null;
    })
    .filter(
      (team): team is { id: string; name: string; shareSchedule: boolean } =>
        Boolean(team)
    )
    .sort((a, b) => a.name.localeCompare(b.name, ["ko", "en"]));

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          설정
        </h1>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
        <SettingsForm
          initialDisplayName={profile?.display_name ?? ""}
          initialIcsUrl={profile?.ics_url ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
          isAdmin={!!profile?.is_admin}
          ownedTeams={ownedTeams}
          initialScheduleShareTeams={scheduleShareTeams}
        />
      </main>
    </>
  );
}
