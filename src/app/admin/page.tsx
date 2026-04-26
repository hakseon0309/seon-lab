import Nav from "@/components/nav";
import RouteTransitionDone from "@/components/route-transition-done";
import AdminPanel from "@/components/admin-panel";
import { loadAdminPanelData } from "@/lib/admin-server";
import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    if (guard.status === 401) redirect("/login");
    redirect("/dashboard");
  }

  const { users, teams } = await loadAdminPanelData();

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
          <AdminPanel initialUsers={users} initialTeams={teams} />
        </div>
      </main>
    </>
  );
}
