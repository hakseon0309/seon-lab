"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageFooter from "@/components/page-footer";
import JoinTeamModal from "@/components/join-team-modal";
import CreateTeamModal from "@/components/create-team-modal";
import { useRouteTransition } from "@/components/route-transition-provider";

export default function TeamsFooterActions() {
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { startNavigation } = useRouteTransition();

  async function handleCreate(name: string) {
    setCreating(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setCreating(false);
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "팀 생성에 실패했습니다");
    }
    const team = await res.json();
    setShowCreate(false);
    startNavigation();
    router.push(`/teams/${team.id}`);
    setCreating(false);
  }

  async function handleJoin(code: string) {
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "팀 가입에 실패했습니다");
    setShowJoin(false);
    startNavigation();
    router.push(`/teams/${data.team_id}`);
  }

  return (
    <>
      <PageFooter>
        <button
          onClick={() => setShowCreate(true)}
          disabled={creating}
          className="flex-1 rounded-full py-3.5 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          {creating ? "생성 중..." : "팀 생성하기"}
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className="flex-1 rounded-full py-3.5 text-sm font-medium border"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          팀 참여하기
        </button>
      </PageFooter>

      {showJoin && (
        <JoinTeamModal
          onClose={() => setShowJoin(false)}
          onJoin={handleJoin}
        />
      )}

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}
