"use client";

import { createClient } from "@/lib/supabase/client";
import { Team } from "@/lib/types";
import Nav from "@/components/nav";
import JoinTeamModal from "@/components/join-team-modal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  async function loadTeams() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const teamIds = memberships.map((m) => m.team_id);
      const { data } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds)
        .order("created_at", { ascending: false });
      if (data) setTeams(data);
    } else {
      setTeams([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreating(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });

    if (res.ok) {
      setNewTeamName("");
      await loadTeams();
    }
    setCreating(false);
  }

  async function handleJoin(code: string) {
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: code }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "팀 가입에 실패했습니다");
    }

    setShowJoinModal(false);

    if (data.already_member) {
      router.push(`/teams/${data.team_id}`);
    } else {
      await loadTeams();
      router.push(`/teams/${data.team_id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-lg px-4 py-6 lg:py-8 pb-24 lg:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            팀
          </h1>
          <button
            onClick={() => setShowJoinModal(true)}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-card)",
            }}
          >
            팀 참여
          </button>
        </div>

        <form onSubmit={handleCreate} className="mb-8 flex gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties}
            placeholder="새 팀 이름"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            {creating ? "생성 중..." : "생성"}
          </button>
        </form>

        {teams.length === 0 ? (
          <p
            className="text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            아직 참여한 팀이 없습니다. 팀을 생성하거나 초대 코드로 참여하세요.
          </p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="flex items-center justify-between rounded-lg border p-4"
                style={{
                  borderColor: "var(--border-light)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {team.name}
                </span>
                <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showJoinModal && (
        <JoinTeamModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoin}
        />
      )}
    </>
  );
}
