import { createAdminClient } from "@/lib/supabase/admin";
import { AdminTeamRow, AdminUserRow } from "@/lib/types";

export async function loadAdminPanelData() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: memberships }, { data: teams }] =
    await Promise.all([
      admin
        .from("user_profiles")
        .select("id, display_name, is_admin")
        .order("display_name", { ascending: true }),
      admin.from("team_members").select("team_id, user_id"),
      admin.from("teams").select("id, name, is_corp_team"),
    ]);

  const teamList = (teams ?? []) as AdminTeamRow[];
  const teamMap = new Map(teamList.map((team) => [team.id, team]));
  const teamsByUser = new Map<string, { id: string; name: string }[]>();

  for (const membership of (memberships ?? []) as {
    team_id: string;
    user_id: string;
  }[]) {
    const team = teamMap.get(membership.team_id);
    if (!team) continue;

    const current = teamsByUser.get(membership.user_id) ?? [];
    current.push({ id: team.id, name: team.name });
    teamsByUser.set(membership.user_id, current);
  }

  const users: AdminUserRow[] = ((profiles ?? []) as {
    id: string;
    display_name: string | null;
    is_admin: boolean | null;
  }[]).map((profile) => ({
    id: profile.id,
    display_name: profile.display_name ?? "",
    is_admin: Boolean(profile.is_admin),
    teams: teamsByUser.get(profile.id) ?? [],
  }));

  return { users, teams: teamList };
}
