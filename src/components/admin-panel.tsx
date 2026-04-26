"use client";

import AdminSyncCard from "@/components/admin-sync-card";
import AdminTeamsTab from "@/components/admin-teams-tab";
import AdminUsersTab from "@/components/admin-users-tab";
import { useToast } from "@/components/toast-provider";
import {
  addAdminUserToTeam,
  removeAdminUserFromTeam,
  syncAllAdminUsers,
  updateAdminCorpTeam,
} from "@/lib/admin-api-client";
import { AdminTeamRow, AdminUserRow } from "@/lib/types";
import { useState } from "react";

interface Props {
  initialUsers: AdminUserRow[];
  initialTeams: AdminTeamRow[];
}

export default function AdminPanel({ initialUsers, initialTeams }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [teams, setTeams] = useState(initialTeams);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "teams">("users");
  const toast = useToast();

  async function addToTeam(userId: string, teamId: string) {
    if (!teamId) return;

    setBusyUserId(userId);
    const result = await addAdminUserToTeam(userId, teamId);
    setBusyUserId(null);

    if (!result.ok) {
      toast.error(result.error || "팀원 추가에 실패했습니다");
      return;
    }

    const targetTeam = teams.find((team) => team.id === teamId);
    if (!targetTeam) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId && !user.teams.some((team) => team.id === teamId)
          ? {
              ...user,
              teams: [...user.teams, { id: targetTeam.id, name: targetTeam.name }],
            }
          : user
      )
    );
    toast.success("팀에 추가했습니다");
  }

  async function removeFromTeam(userId: string, teamId: string) {
    setBusyUserId(userId);
    const result = await removeAdminUserFromTeam(userId, teamId);
    setBusyUserId(null);

    if (!result.ok) {
      toast.error(result.error || "팀원 제거에 실패했습니다");
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              teams: user.teams.filter((team) => team.id !== teamId),
            }
          : user
      )
    );
    toast.success("팀에서 제거했습니다");
  }

  async function toggleCorpTeam(teamId: string, current: boolean) {
    setBusyTeamId(teamId);
    const result = await updateAdminCorpTeam(teamId, !current);
    setBusyTeamId(null);

    if (!result.ok) {
      toast.error(result.error || "팀 업데이트에 실패했습니다");
      return;
    }

    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, is_corp_team: !current } : team
      )
    );
    toast.success(!current ? "회사팀으로 지정했습니다" : "회사팀 지정을 해제했습니다");
  }

  async function handleSyncAllUsers() {
    setSyncingAll(true);
    setSyncMessage("");

    const result = await syncAllAdminUsers();
    setSyncingAll(false);

    if (!result.ok) {
      setSyncMessage(result.error || "전체 동기화에 실패했습니다");
      toast.error(result.error || "전체 동기화에 실패했습니다");
      return;
    }

    setSyncMessage(
      `전체 동기화 완료: ${result.data.synced}/${result.data.total}명 성공, ${result.data.failed}명 실패`
    );
    toast.success("전체 동기화를 완료했습니다");
  }

  const tabStyle = (active: boolean) => ({
    borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
    color: active ? "var(--primary)" : ("var(--text-muted)" as string),
  });

  return (
    <div className="page-stack">
      <AdminSyncCard
        syncing={syncingAll}
        message={syncMessage}
        onSync={handleSyncAllUsers}
      />

      <div
        className="flex gap-4 border-b"
        style={{ borderColor: "var(--border-light)" }}
      >
        {(["users", "teams"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className="pb-2 text-sm font-medium"
            style={tabStyle(tab === value)}
          >
            {value === "users"
              ? `사용자 (${users.length})`
              : `팀 (${teams.length})`}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <AdminUsersTab
          users={users}
          teams={teams}
          busyUserId={busyUserId}
          onAddToTeam={addToTeam}
          onRemoveFromTeam={removeFromTeam}
        />
      ) : (
        <AdminTeamsTab
          teams={teams}
          busyTeamId={busyTeamId}
          onToggleCorpTeam={toggleCorpTeam}
        />
      )}
    </div>
  );
}
