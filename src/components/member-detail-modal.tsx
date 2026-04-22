"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import { UserProfile } from "@/lib/types";

interface Props {
  member: { profile: UserProfile; joinedAt: string | null };
  isLeader: boolean;
  isCurrentUser: boolean;
  onClose: () => void;
  onTransferOwnership: (userId: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function MemberDetailModal({
  member,
  isLeader,
  isCurrentUser,
  onClose,
  onTransferOwnership,
  onRemoveMember,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { profile, joinedAt } = member;

  async function handleRemove() {
    if (!onRemoveMember) return;
    if (!confirm(`${profile.display_name}님을 팀에서 제거할까요?`)) return;
    setLoading(true);
    setError("");
    try {
      await onRemoveMember(profile.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "멤버 제거에 실패했습니다");
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      await onTransferOwnership(profile.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "팀장 위임에 실패했습니다");
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <Modal title="멤버 정보" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-muted)",
            }}
          >
            {profile.display_name.charAt(0) || "?"}
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {profile.display_name}
            </p>
          </div>
        </div>

        <dl className="space-y-3 rounded-lg border p-4" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-surface)" }}>
          <div className="flex items-center justify-between">
            <dt className="text-xs" style={{ color: "var(--text-muted)" }}>서비스 가입일</dt>
            <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
              {formatDate(profile.created_at)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-xs" style={{ color: "var(--text-muted)" }}>팀 가입일</dt>
            <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
              {formatDate(joinedAt)}
            </dd>
          </div>
        </dl>

        {error && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
          >
            {error}
          </div>
        )}

        {isLeader && !isCurrentUser && (
          <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--border-light)" }}>
            {!confirming ? (
              <>
                <button
                  onClick={() => setConfirming(true)}
                  className="w-full rounded-lg py-2.5 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--text-on-primary)",
                  }}
                >
                  이 멤버에게 팀장 위임
                </button>
                {onRemoveMember && (
                  <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="w-full rounded-lg border py-2.5 text-sm font-medium disabled:opacity-50"
                    style={{ borderColor: "var(--border)", color: "var(--error)" }}
                  >
                    팀에서 제거
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                  정말 위임할까요? 위임 후에는 취소할 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
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
                    onClick={handleConfirm}
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
    </Modal>
  );
}
