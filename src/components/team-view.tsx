"use client";

import {
  CalendarWindow,
  isWindowEndMonth,
  isWindowStartMonth,
  parseMonthKey,
} from "@/lib/calendar-window";
import InviteModal from "@/components/invite-modal";
import MembersListModal from "@/components/members-list-modal";
import TeamCalendar from "@/components/team-calendar";
import CalendarMonthNavigator from "@/components/calendar-month-navigator";
import TeamViewHeader from "@/components/team-view-header";
import { useToast } from "@/components/toast-provider";
import {
  removeTeamMember,
  renameTeam,
  setTeamFavorite,
  transferTeamOwnership,
} from "@/lib/team-api-client";
import { MemberWithEvents } from "@/lib/team-types";
import { LABEL } from "@/lib/labels";
import { Team } from "@/lib/types";
import { useCallback, useMemo, useState, useTransition } from "react";

interface Props {
  team: Team;
  initialMembers: MemberWithEvents[];
  currentUserId: string;
  initialIsFavorite: boolean;
  calendarWindow: CalendarWindow;
}

export type { MemberWithEvents };

export default function TeamView({
  team: initialTeam,
  initialMembers,
  currentUserId,
  initialIsFavorite,
  calendarWindow,
}: Props) {
  const minMonthDate = parseMonthKey(calendarWindow.minMonth);
  const maxMonthDate = parseMonthKey(calendarWindow.maxMonth);
  const [team, setTeam] = useState(initialTeam);
  const [members, setMembers] = useState(initialMembers);
  const [currentDate, setCurrentDate] = useState(
    parseMonthKey(calendarWindow.initialMonth)
  );
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [preselectedMemberId, setPreselectedMemberId] = useState<string | null>(
    null
  );
  const [returnToListOnDetailClose, setReturnToListOnDetailClose] =
    useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(initialTeam.name);
  const [renameError, setRenameError] = useState("");
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [isChangingMonth, startMonthTransition] = useTransition();
  const toast = useToast();
  const memberItems = useMemo(
    () =>
      members.map((member) => ({
        profile: member.profile,
        joinedAt: member.joinedAt,
      })),
    [members]
  );

  async function handleRename() {
    const nextName = newName.trim();

    if (!nextName || nextName === team.name) {
      setEditingName(false);
      return;
    }

    setRenameError("");
    const result = await renameTeam(team.id, nextName);

    if (!result.ok) {
      setRenameError(result.error || "이름 변경에 실패했습니다");
      return;
    }

    setTeam(result.data);
    setNewName(result.data.name);
    setEditingName(false);
    toast.success("팀 이름을 변경했습니다");
  }

  async function handleRemoveMember(userId: string) {
    const result = await removeTeamMember(team.id, userId);
    if (!result.ok) {
      throw new Error(result.error || `${LABEL.member} 제거에 실패했습니다`);
    }

    setMembers((prev) => prev.filter((member) => member.profile.id !== userId));
    toast.success(`${LABEL.member}을 제거했습니다`);
  }

  async function handleTransferOwnership(userId: string) {
    const result = await transferTeamOwnership(team.id, userId);
    if (!result.ok) {
      throw new Error(result.error || "팀장 위임에 실패했습니다");
    }

    setTeam((prev) => ({ ...prev, created_by: userId }));
    setShowMembers(false);
    toast.success("팀장을 위임했습니다");
  }

  async function toggleFavorite() {
    const nextFavorite = !isFavorite;
    setSavingFavorite(true);

    const result = await setTeamFavorite(team.id, nextFavorite);
    setSavingFavorite(false);

    if (!result.ok) {
      toast.error(result.error || "즐겨찾기 변경에 실패했습니다");
      return;
    }

    setIsFavorite(nextFavorite);
    toast.success(
      nextFavorite
        ? "즐겨찾기에 추가했습니다"
        : "즐겨찾기에서 제거했습니다"
    );
  }

  const openMembersList = useCallback(() => {
    setPreselectedMemberId(null);
    setReturnToListOnDetailClose(true);
    setShowMembers(true);
  }, []);

  const openMemberDetail = useCallback((userId: string) => {
    setPreselectedMemberId(userId);
    setReturnToListOnDetailClose(false);
    setShowMembers(true);
  }, []);

  const closeMembersModal = useCallback(() => {
    setShowMembers(false);
    setPreselectedMemberId(null);
    setReturnToListOnDetailClose(true);
  }, []);

  const shiftMonth = useCallback((offset: number) => {
    startMonthTransition(() => {
      setCurrentDate((prev) => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
        if (next < minMonthDate || next > maxMonthDate) {
          return prev;
        }
        return next;
      });
    });
  }, [maxMonthDate, minMonthDate, startMonthTransition]);

  const previousDisabled = isWindowStartMonth(currentDate, calendarWindow);
  const nextDisabled = isWindowEndMonth(currentDate, calendarWindow);

  return (
    <>
      <TeamViewHeader
        team={team}
        memberCount={members.length}
        currentUserId={currentUserId}
        editingName={editingName}
        newName={newName}
        renameError={renameError}
        isFavorite={isFavorite}
        savingFavorite={savingFavorite}
        onUpdatedTeam={setTeam}
        onStartEditingName={() => setEditingName(true)}
        onChangeName={(value) => {
          setNewName(value);
          setRenameError("");
        }}
        onSubmitName={handleRename}
        onCancelEditingName={() => {
          setEditingName(false);
          setRenameError("");
          setNewName(team.name);
        }}
        onToggleFavorite={toggleFavorite}
        onOpenMembers={openMembersList}
        onOpenInvite={() => setShowInvite(true)}
      />

      {showInvite && (
        <InviteModal
          inviteCode={team.invite_code}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showMembers && (
        <MembersListModal
          members={memberItems}
          leaderId={team.created_by}
          isLeader={team.created_by === currentUserId}
          currentUserId={currentUserId}
          initialSelectedId={preselectedMemberId}
          returnToListOnDetailClose={returnToListOnDetailClose}
          onClose={closeMembersModal}
          onTransferOwnership={handleTransferOwnership}
          onRemoveMember={handleRemoveMember}
        />
      )}

      <main className="mx-auto max-w-5xl px-0 pb-tabbar lg:px-4 lg:pb-6">
        <CalendarMonthNavigator
          currentDate={currentDate}
          pending={isChangingMonth}
          previousDisabled={previousDisabled}
          nextDisabled={nextDisabled}
          onPrevious={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />

        <TeamCalendar
          members={members}
          currentDate={currentDate}
          onMemberClick={openMemberDetail}
        />
      </main>
    </>
  );
}
