"use client";

import { AdminUserRow } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption {
  id: string;
  name: string;
  is_corp_team: boolean;
}

interface Props {
  initialUsers: AdminUserRow[];
  initialTeams: TeamOption[];
}

export default function AdminPanel({ initialUsers, initialTeams }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [teams, setTeams] = useState(initialTeams);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "teams">("users");
  const router = useRouter();

  async function reload() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTeams(data.teams);
    }
    router.refresh();
  }

  async function addToTeam(user_id: string, team_id: string) {
    if (!team_id) return;
    setBusyUserId(user_id);
    await fetch("/api/admin/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, team_id }),
    });
    await reload();
    setBusyUserId(null);
  }

  async function removeFromTeam(user_id: string, team_id: string) {
    setBusyUserId(user_id);
    await fetch("/api/admin/team-members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, team_id }),
    });
    await reload();
    setBusyUserId(null);
  }

  async function toggleCorpTeam(team_id: string, current: boolean) {
    setBusyTeamId(team_id);
    await fetch("/api/admin/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id, is_corp_team: !current }),
    });
    await reload();
    setBusyTeamId(null);
  }

  async function handleSyncAllUsers() {
    setSyncingAll(true);
    setSyncMessage("");

    try {
      const res = await fetch("/api/admin/sync-all", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setSyncMessage(data.error || "전체 동기화에 실패했습니다");
        return;
      }

      setSyncMessage(`전체 동기화 완료: ${data.synced}/${data.total}명 성공, ${data.failed}명 실패`);
    } catch {
      setSyncMessage("전체 동기화에 실패했습니다");
    } finally {
      setSyncingAll(false);
    }
  }

  const tabStyle = (active: boolean) => ({
    borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
    color: active ? "var(--primary)" : ("var(--text-muted)" as string),
  });

  return (
    <div className="page-stack">
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              모든 사용자 시프트 동기화
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              관리자 권한으로 전체 사용자 ICS 데이터를 즉시 새로고침합니다.
            </p>
          </div>
          <button
            onClick={handleSyncAllUsers}
            disabled={syncingAll}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
          >
            {syncingAll ? "동기화 중..." : "전체 새로고침"}
          </button>
        </div>
        {syncMessage && (
          <p
            className="mt-3 text-xs"
            style={{
              color: syncMessage.includes("실패") ? "var(--error)" : "var(--text-muted)",
            }}
          >
            {syncMessage}
          </p>
        )}
      </div>

      <div className="flex gap-4 border-b" style={{ borderColor: "var(--border-light)" }}>
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
                  onChange={(e) => {
                    addToTeam(u.id, e.target.value);
                    e.target.value = "";
                  }}
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
                        {t.name}
                        {t.is_corp_team ? " 🏢" : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    ? {
                        borderColor: "var(--primary)",
                        color: "var(--primary)",
                        backgroundColor: "var(--primary-light)",
                      }
                    : {
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                        backgroundColor: "var(--bg-card)",
                      }
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
    </div>
  );
}
