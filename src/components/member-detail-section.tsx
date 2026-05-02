"use client";

import { LABEL } from "@/lib/labels";
import { TeamMemberItem } from "@/lib/team-types";

interface Props {
  member: TeamMemberItem;
  isLeader: boolean;
  currentUserId: string;
  loading: boolean;
  confirming: boolean;
  error: string;
  onStartConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirmTransfer: () => void;
  onStartRemoveConfirm: () => void;
  onHasRemove: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function MemberDetailSection({
  member,
  isLeader,
  currentUserId,
  loading,
  confirming,
  error,
  onStartConfirm,
  onCancelConfirm,
  onConfirmTransfer,
  onStartRemoveConfirm,
  onHasRemove,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-muted)",
          }}
        >
          {member.profile.display_name.charAt(0) || "?"}
        </div>
        <div className="text-center">
          <p
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {member.profile.display_name}
          </p>
        </div>
      </div>

      <dl
        className="space-y-3 rounded-lg border p-4"
        style={{
          borderColor: "var(--border-light)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div className="flex items-center justify-between">
          <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
            서비스 가입일
          </dt>
          <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
            {formatDate(member.profile.created_at)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
            팀 가입일
          </dt>
          <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
            {formatDate(member.joinedAt)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
            일정 공유
          </dt>
          <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
            {member.shareSchedule ? "공유 중" : "공유 안 함"}
          </dd>
        </div>
      </dl>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {isLeader && member.profile.id !== currentUserId && (
        <div
          className="space-y-2 border-t pt-4"
          style={{ borderColor: "var(--border-light)" }}
        >
          {!confirming ? (
            <>
              <button
                onClick={onStartConfirm}
                className="w-full rounded-lg py-2.5 text-sm font-medium"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                }}
              >
                이 {LABEL.member}에게 팀장 위임
              </button>
              {onHasRemove && (
                <button
                  onClick={onStartRemoveConfirm}
                  disabled={loading}
                  className="interactive-press w-full rounded-lg border py-2.5 text-sm font-medium disabled:opacity-50"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--error)",
                  }}
                >
                  팀에서 제거
                </button>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <p
                className="text-center text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                정말 위임할까요? 위임 후에는 취소할 수 없습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onCancelConfirm}
                  disabled={loading}
                  className="flex-1 rounded-lg border py-2 text-sm disabled:opacity-50"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={onConfirmTransfer}
                  disabled={loading}
                  className="flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--text-on-primary)",
                  }}
                >
                  {loading ? "처리 중..." : "위임하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
