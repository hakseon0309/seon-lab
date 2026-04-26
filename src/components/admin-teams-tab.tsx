"use client";

import { AdminTeamRow } from "@/lib/types";

interface Props {
  teams: AdminTeamRow[];
  busyTeamId: string | null;
  onToggleCorpTeam: (teamId: string, current: boolean) => void;
}

export default function AdminTeamsTab({
  teams,
  busyTeamId,
  onToggleCorpTeam,
}: Props) {
  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded-lg border p-4"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {team.name}
              {team.is_corp_team && (
                <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  🏢
                </span>
              )}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {team.id}
            </p>
          </div>
          <button
            disabled={busyTeamId === team.id}
            onClick={() => onToggleCorpTeam(team.id, team.is_corp_team)}
            className="rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            style={
              team.is_corp_team
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
            {team.is_corp_team ? "회사팀 ✓" : "회사팀 지정"}
          </button>
        </div>
      ))}
      {teams.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          팀이 없습니다.
        </p>
      )}
    </div>
  );
}
