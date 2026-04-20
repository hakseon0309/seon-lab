"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Team } from "@/lib/types";
import { useRouteTransition } from "@/components/route-transition-provider";

export default function CorpTeamSection({ teams }: { teams: Team[] }) {
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { startNavigation } = useRouteTransition();

  async function handleJoin(team: Team) {
    setJoiningId(team.id);
    setError("");
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: team.invite_code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "팀 가입에 실패했습니다");
      startNavigation();
      router.push(`/teams/${data.team_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가입 실패");
      setJoiningId(null);
    }
  }

  return (
    <div>
      <p
        className="mb-2 px-4 lg:px-0 text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        🏢 회사 팀
      </p>
      <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between border-y px-4 py-4 lg:mx-0 lg:rounded-lg lg:border lg:mb-2"
            style={{
              borderColor: "var(--primary)",
              backgroundColor: "var(--primary-light)",
            }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              {team.name}
            </span>
            <button
              onClick={() => handleJoin(team)}
              disabled={joiningId === team.id}
              className="rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-on-primary)",
              }}
            >
              {joiningId === team.id ? "참여 중..." : "참여"}
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p
          className="mt-1 px-4 lg:px-0 text-xs"
          style={{ color: "var(--error)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
