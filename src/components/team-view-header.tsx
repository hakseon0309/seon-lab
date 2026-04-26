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
  onUpdatedTeam: (team: Team) => void;
  onStartEditingName: () => void;
  onChangeName: (value: string) => void;
  onSubmitName: () => void;
  onCancelEditingName: () => void;
  onToggleFavorite: () => void;
  onOpenMembers: () => void;
  onOpenInvite: () => void;
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
  onUpdatedTeam,
  onStartEditingName,
  onChangeName,
  onSubmitName,
  onCancelEditingName,
  onToggleFavorite,
  onOpenMembers,
  onOpenInvite,
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
          onClick={onToggleFavorite}
          disabled={savingFavorite}
          aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border text-base disabled:opacity-50"
          style={{
            borderColor: "var(--border)",
            color: isFavorite ? "var(--primary)" : "var(--text-muted)",
            backgroundColor: isFavorite
              ? "var(--primary-light)"
              : "transparent",
          }}
        >
          ★
        </button>
        <button
          onClick={onOpenMembers}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {LABEL.member}
        </button>
        <button
          onClick={onOpenInvite}
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
  );
}
