import Nav from "@/components/nav";
import RouteTransitionDone from "@/components/route-transition-done";
import AdminPanel from "@/components/admin-panel";
import { AdminUserRow } from "@/lib/types";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    if (guard.status === 401) redirect("/login");
    redirect("/dashboard");
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

  const teamList = (teams ?? []) as { id: string; name: string; is_corp_team: boolean }[];
  const teamMap = new Map(teamList.map((t) => [t.id, t]));
  const teamsByUser = new Map<string, { id: string; name: string }[]>();
  for (const m of (memberships ?? []) as { team_id: string; user_id: string }[]) {
    const t = teamMap.get(m.team_id);
    if (!t) continue;
    const list = teamsByUser.get(m.user_id) ?? [];
    list.push({ id: t.id, name: t.name });
    teamsByUser.set(m.user_id, list);
  }

  const users: AdminUserRow[] = ((profiles ?? []) as {
    id: string;
    display_name: string | null;
    is_admin: boolean | null;
  }[]).map((p) => ({
    id: p.id,
    display_name: p.display_name ?? "",
    is_admin: !!p.is_admin,
    teams: teamsByUser.get(p.id) ?? [],
  }));

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <main className="mx-auto w-full max-w-3xl pb-tabbar lg:pb-8">
        <div className="px-4 lg:px-0">
          <div className="page-title-block">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              관리자
            </h1>
          </div>
          <AdminPanel initialUsers={users} initialTeams={teamList} />
        </div>
      </main>
    </>
  );
}
