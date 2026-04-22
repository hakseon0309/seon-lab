import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) {
    return apiError(guard.status, guard.error, "forbidden");
  }

  const admin = createAdminClient();

  const [{ data: profiles }, { data: memberships }, { data: teams }] = await Promise.all([
    admin
      .from("user_profiles")
      .select("id, display_name, is_admin")
      .order("display_name", { ascending: true }),
    admin.from("team_members").select("team_id, user_id"),
    admin.from("teams").select("id, name, is_corp_team"),
  ]);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const teamsByUser = new Map<string, { id: string; name: string }[]>();
  for (const m of memberships ?? []) {
    const t = teamMap.get(m.team_id);
    if (!t) continue;
    const list = teamsByUser.get(m.user_id) ?? [];
    list.push({ id: t.id, name: t.name });
    teamsByUser.set(m.user_id, list);
  }

  const rows = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    is_admin: !!p.is_admin,
    teams: teamsByUser.get(p.id) ?? [],
  }));

  return NextResponse.json({ users: rows, teams: teams ?? [] });
}
