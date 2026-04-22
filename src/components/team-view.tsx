"use client";

import { Team, CalendarEvent, UserProfile } from "@/lib/types";
import PageHeader from "@/components/page-header";
import TeamCalendar from "@/components/team-calendar";
import InviteModal from "@/components/invite-modal";
import MembersListModal from "@/components/members-list-modal";
import MemberDetailModal from "@/components/member-detail-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/components/toast-provider";

export interface MemberWithEvents {
  profile: UserProfile;
  joinedAt: string | null;
  events: CalendarEvent[];
}

interface Props {
  team: Team;
  initialMembers: MemberWithEvents[];
  currentUserId: string;
}

export default function TeamView({ team: initialTeam, initialMembers, currentUserId }: Props) {
  const [team, setTeam] = useState(initialTeam);
  const [members, setMembers] = useState(initialMembers);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(initialTeam.name);
  const [renameError, setRenameError] = useState("");
  const router = useRouter();
  const toast = useToast();

  const isLeader = team.created_by === currentUserId;
  const selectedMember = selectedMemberId
    ? members.find((m) => m.profile.id === selectedMemberId) ?? null
    : null;

  async function handleRename() {
    if (!newName.trim() || newName.trim() === team.name) {
      setEditingName(false);
      return;
    }
    setRenameError("");
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTeam(updated);
      setEditingName(false);
      toast.success("팀 이름을 변경했습니다");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setRenameError(data.error || "이름 변경에 실패했습니다");
    }
  }

  async function handleRemoveMember(userId: string) {
    const res = await fetch(`/api/teams/${team.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "멤버 제거에 실패했습니다");
    }
    setMembers((prev) => prev.filter((m) => m.profile.id !== userId));
    setSelectedMemberId(null);
    toast.success("멤버를 제거했습니다");
    router.refresh();
  }

  async function handleTransferOwnership(userId: string) {
    const res = await fetch(`/api/teams/${team.id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_owner_id: userId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "팀장 위임에 실패했습니다");
    }
    setTeam((prev) => ({ ...prev, created_by: userId }));
    setSelectedMemberId(null);
    setShowMembers(false);
    toast.success("팀장을 위임했습니다");
    router.refresh();
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  return (
    <>
      <PageHeader>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename();
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setRenameError(""); }}
                  className="text-lg font-bold rounded-md border px-2 py-0.5 focus:outline-none focus:ring-2"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--input-bg)",
                    borderColor: renameError ? "var(--error)" : "var(--input-border)",
                    "--tw-ring-color": "var(--primary)",
                  } as React.CSSProperties}
                />
                <button
                  type="submit"
                  className="shrink-0 text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setRenameError(""); setNewName(team.name); }}
                  className="shrink-0 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  취소
                </button>
              </form>
              {renameError && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--error)" }}>
                  {renameError}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-bold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {team.name}
              </h1>
              {isLeader && (
                <button
                  onClick={() => setEditingName(true)}
                  className="shrink-0 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  수정
                </button>
              )}
            </div>
          )}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {members.length}명의 멤버
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMembers(true)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            멤버
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            초대
          </button>
        </div>
      </PageHeader>

      {showInvite && (
        <InviteModal inviteCode={team.invite_code} onClose={() => setShowInvite(false)} />
      )}

      {showMembers && !selectedMember && (
        <MembersListModal
          members={members.map((m) => ({ profile: m.profile, joinedAt: m.joinedAt }))}
          leaderId={team.created_by}
          onClose={() => setShowMembers(false)}
          onSelectMember={(m) => setSelectedMemberId(m.profile.id)}
        />
      )}

      {selectedMember && (
        <MemberDetailModal
          member={{ profile: selectedMember.profile, joinedAt: selectedMember.joinedAt }}
          isLeader={isLeader}
          isCurrentUser={selectedMember.profile.id === currentUserId}
          onClose={() => setSelectedMemberId(null)}
          onTransferOwnership={handleTransferOwnership}
          onRemoveMember={handleRemoveMember}
        />
      )}

      <main className="mx-auto max-w-5xl px-0 lg:px-4 py-4 lg:py-6 pb-24 lg:pb-6">
        <div className="mb-3 flex items-center justify-between px-4 lg:px-0">
          <button
            onClick={prevMonth}
            aria-label="이전 달"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-card)" }}
          >
            ‹
          </button>
          <h2
            className="text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            onClick={nextMonth}
            aria-label="다음 달"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-card)" }}
          >
            ›
          </button>
        </div>

        <TeamCalendar members={members} currentDate={currentDate} />
      </main>
    </>
  );
}
