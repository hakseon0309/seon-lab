"use client";

import TeamAvatarControl from "@/components/team-avatar-control";
import type { Team } from "@/lib/types";
import Link from "next/link";

interface TeamListProps {
  initialTeams: Team[];
}

export default function TeamList({ initialTeams }: TeamListProps) {
  return (
    <div className="space-y-4">
      {initialTeams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="interactive-press flex items-center justify-between rounded-lg border p-4"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <TeamAvatarControl team={team} />
            <span
              className="truncate text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {team.name}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
