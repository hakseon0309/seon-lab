"use client";

import PageHeader from "@/components/page-header";
import TeamAvatarControl from "@/components/team-avatar-control";
import { Team } from "@/lib/types";
import { LABEL } from "@/lib/labels";

interface Props {
  team: Team;
  memberCount: number;
  currentUserId: string;
  editingName: boolean;
  newName: string;
  renameError: string;
  isFavorite: boolean;
  savingFavorite: boolean;
  shareSchedule: boolean;
  savingShareSchedule: boolean;
  onUpdatedTeam: (team: Team) => void;
  onStartEditingName: () => void;
  onChangeName: (value: string) => void;
  onSubmitName: () => void;
  onCancelEditingName: () => void;
  onToggleFavorite: () => void;
  onToggleScheduleSharing: () => void;
  onOpenMembers: () => void;
}

export default function TeamViewHeader({
  team,
  memberCount,
  currentUserId,
  editingName,
  newName,
  renameError,
  isFavorite,
  savingFavorite,
  shareSchedule,
  savingShareSchedule,
  onUpdatedTeam,
  onStartEditingName,
  onChangeName,
  onSubmitName,
  onCancelEditingName,
  onToggleFavorite,
  onToggleScheduleSharing,
  onOpenMembers,
}: Props) {
  const isLeader = team.created_by === currentUserId;

  return (
    <PageHeader>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <TeamAvatarControl
          team={team}
          editable={isLeader}
          onUpdated={onUpdatedTeam}
          sizeClass="h-10 w-10"
          refreshOnComplete={false}
        />
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmitName();
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(event) => onChangeName(event.target.value)}
                  className="rounded-md border px-2 py-0.5 text-lg font-bold focus:outline-none focus:ring-2"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--input-bg)",
                    borderColor: renameError
                      ? "var(--error)"
                      : "var(--input-border)",
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
                  onClick={onCancelEditingName}
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
                className="truncate text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {team.name}
              </h1>
              {isLeader && (
                <button
                  onClick={onStartEditingName}
                  className="shrink-0 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  수정
                </button>
              )}
            </div>
          )}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {memberCount}명의 {LABEL.member}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={savingFavorite}
          aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          aria-pressed={isFavorite}
          className="interactive-press flex h-8 w-8 items-center justify-center rounded-full border text-sm disabled:opacity-40"
          style={{
            borderColor: "var(--border-light)",
            color: isFavorite ? "var(--primary)" : "var(--text-muted)",
            backgroundColor: isFavorite ? "var(--primary-light)" : "transparent",
          }}
        >
          <span aria-hidden="true">★</span>
        </button>
        <button
          type="button"
          onClick={onToggleScheduleSharing}
          disabled={savingShareSchedule}
          aria-label={
            shareSchedule
              ? "근무 일정 공유 끄기"
              : "근무 일정 공유 켜기"
          }
          aria-pressed={shareSchedule}
          className="interactive-press flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40"
          style={{
            borderColor: "var(--border-light)",
            color: shareSchedule ? "var(--primary)" : "var(--text-muted)",
            backgroundColor: shareSchedule
              ? "var(--primary-light)"
              : "transparent",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M12 15V3" />
            <path d="m8 7 4-4 4 4" />
            <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpenMembers}
          aria-label={`${LABEL.member} 목록 보기`}
          className="interactive-press flex h-8 w-8 items-center justify-center rounded-full border"
          style={{
            borderColor: "var(--border-light)",
            color: "var(--text-muted)",
            backgroundColor: "transparent",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M16 19v-1.5a3.5 3.5 0 0 0-7 0V19" />
            <circle cx="12.5" cy="8" r="3.5" />
            <path d="M5 19v-1a3 3 0 0 1 3-3" />
            <path d="M7.5 6.2a3 3 0 0 0 0 5.6" />
          </svg>
        </button>
      </div>
    </PageHeader>
  );
}
