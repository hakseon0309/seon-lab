"use client";

import { AdminUserRow, AdminTeamRow } from "@/lib/types";

interface Props {
  users: AdminUserRow[];
  teams: AdminTeamRow[];
  busyUserId: string | null;
  onAddToTeam: (userId: string, teamId: string) => void;
  onRemoveFromTeam: (userId: string, teamId: string) => void;
}

export default function AdminUsersTab({
  users,
  teams,
  busyUserId,
  onAddToTeam,
  onRemoveFromTeam,
}: Props) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="rounded-lg border p-4"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {user.display_name || "(이름 없음)"}
            {user.is_admin && (
              <span
                className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                style={{
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                ADMIN
              </span>
            )}
          </p>
          <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {user.id}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {user.teams.length === 0 ? (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                참여 팀 없음
              </span>
            ) : (
              user.teams.map((team) => (
                <button
                  key={team.id}
                  disabled={busyUserId === user.id}
                  onClick={() => onRemoveFromTeam(user.id, team.id)}
                  className="rounded-md px-2 py-0.5 text-xs disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--event-bg)",
                    color: "var(--event-text)",
                  }}
                  title="클릭하여 제거"
                >
                  {team.name} ✕
                </button>
              ))
            )}
          </div>

          <div className="mt-3">
            <select
              disabled={busyUserId === user.id}
              onChange={(event) => {
                onAddToTeam(user.id, event.target.value);
                event.target.value = "";
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
                .filter((team) => !user.teams.some((item) => item.id === team.id))
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.is_corp_team ? " 🏢" : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
