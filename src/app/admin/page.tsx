"use client";

import Nav from "@/components/nav";
import LoadingScreen from "@/components/loading-screen";
import { AdminUserRow } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption {
  id: string;
  name: string;
  is_corp_team: boolean;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "teams">("users");
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) { router.replace("/dashboard"); return; }
    if (!res.ok) {
      const text = await res.text();
      console.error("Admin API error", res.status, text);
      setLoadError(`서버 오류 (${res.status}). SUPABASE_SERVICE_ROLE_KEY가 .env.local에 있는지 확인하세요.`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users);
    setTeams(data.teams);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function addToTeam(user_id: string, team_id: string) {
    if (!team_id) return;
    setBusyUserId(user_id);
    await fetch("/api/admin/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, team_id }),
    });
    await load();
    setBusyUserId(null);
  }

  async function removeFromTeam(user_id: string, team_id: string) {
    setBusyUserId(user_id);
    await fetch("/api/admin/team-members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, team_id }),
    });
    await load();
    setBusyUserId(null);
  }

  async function toggleCorpTeam(team_id: string, current: boolean) {
    setBusyTeamId(team_id);
    await fetch("/api/admin/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id, is_corp_team: !current }),
    });
    await load();
    setBusyTeamId(null);
  }

  if (loading) return <LoadingScreen />;

  if (loadError) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-lg px-4 py-8">
          <p className="text-sm" style={{ color: "var(--error)" }}>{loadError}</p>
        </main>
      </>
    );
  }

  const tabStyle = (active: boolean) => ({
    borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
    color: active ? "var(--primary)" : "var(--text-muted)" as string,
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-6 lg:py-8 pb-24 lg:pb-8">
        <h1 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          관리자
        </h1>

        {/* 탭 */}
        <div className="mb-6 flex gap-4 border-b" style={{ borderColor: "var(--border-light)" }}>
          {(["users", "teams"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2 text-sm font-medium"
              style={tabStyle(tab === t)}
            >
              {t === "users" ? `사용자 (${users.length})` : `팀 (${teams.length})`}
            </button>
          ))}
        </div>

        {/* 사용자 탭 */}
        {tab === "users" && (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {u.display_name || "(이름 없음)"}
                  {u.is_admin && (
                    <span
                      className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                      style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  {u.id}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {u.teams.length === 0 ? (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      참여 팀 없음
                    </span>
                  ) : (
                    u.teams.map((t) => (
                      <button
                        key={t.id}
                        disabled={busyUserId === u.id}
                        onClick={() => removeFromTeam(u.id, t.id)}
                        className="rounded-md px-2 py-0.5 text-xs disabled:opacity-50"
                        style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}
                        title="클릭하여 제거"
                      >
                        {t.name} ✕
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <select
                    disabled={busyUserId === u.id}
                    onChange={(e) => { addToTeam(u.id, e.target.value); e.target.value = ""; }}
                    className="rounded-md border px-2 py-1 text-xs"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                    defaultValue=""
                  >
                    <option value="">+ 팀에 추가</option>
                    {teams
                      .filter((t) => !u.teams.some((ut) => ut.id === t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.is_corp_team ? " 🏢" : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 팀 탭 */}
        {tab === "teams" && (
          <div className="space-y-3">
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border p-4"
                style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {t.name}
                    {t.is_corp_team && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        🏢
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.id}
                  </p>
                </div>
                <button
                  disabled={busyTeamId === t.id}
                  onClick={() => toggleCorpTeam(t.id, t.is_corp_team)}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={
                    t.is_corp_team
                      ? { borderColor: "var(--primary)", color: "var(--primary)", backgroundColor: "var(--primary-light)" }
                      : { borderColor: "var(--border)", color: "var(--text-muted)", backgroundColor: "var(--bg-card)" }
                  }
                >
                  {t.is_corp_team ? "회사팀 ✓" : "회사팀 지정"}
                </button>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                팀이 없습니다.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
