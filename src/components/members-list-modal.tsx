"use client";

import Modal from "@/components/modal";
import { UserProfile } from "@/lib/types";
import { LABEL } from "@/lib/labels";
import { useState } from "react";

interface MemberItem {
  profile: UserProfile;
  joinedAt: string | null;
}

interface Props {
  members: MemberItem[];
  leaderId: string;
  isLeader: boolean;
  currentUserId: string;
  onClose: () => void;
  onTransferOwnership: (userId: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 팀원 리스트 + 팀원 상세를 같은 Modal 안에서 전환한다.
 * 두 개의 Modal 을 번갈아 mount/unmount 하면 그 사이에 portal 백드롭이
 * 순간적으로 사라졌다가 다시 나타나 화면이 깜빡이는 현상이 발생하므로,
 * Modal 을 절대 갈아끼우지 말고 이 컴포넌트 하나가 두 모드를 모두 담당한다.
 */
export default function MembersListModal({
  members,
  leaderId,
  isLeader,
  currentUserId,
  onClose,
  onTransferOwnership,
  onRemoveMember,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = selectedId
    ? members.find((m) => m.profile.id === selectedId) ?? null
    : null;

  async function handleRemove() {
    if (!selected || !onRemoveMember) return;
    if (
      !confirm(`${selected.profile.display_name}님을 팀에서 제거할까요?`)
    )
      return;
    setLoading(true);
    setError("");
    try {
      await onRemoveMember(selected.profile.id);
      setSelectedId(null);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${LABEL.member} 제거에 실패했습니다`
      );
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await onTransferOwnership(selected.profile.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "팀장 위임에 실패했습니다"
      );
      setLoading(false);
      setConfirming(false);
    }
  }

  function closeAll() {
    setSelectedId(null);
    setConfirming(false);
    setError("");
    onClose();
  }

  function backToList() {
    setSelectedId(null);
    setConfirming(false);
    setError("");
  }

  const title = selected
    ? `${LABEL.member} 정보`
    : `${LABEL.member} (${members.length}명)`;

  return (
    <Modal title={title} onClose={selected ? backToList : closeAll}>
      {selected ? (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold"
              style={{
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-muted)",
              }}
            >
              {selected.profile.display_name.charAt(0) || "?"}
            </div>
            <div className="text-center">
              <p
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {selected.profile.display_name}
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
                {formatDate(selected.profile.created_at)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
                팀 가입일
              </dt>
              <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
                {formatDate(selected.joinedAt)}
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

          {isLeader && selected.profile.id !== currentUserId && (
            <div
              className="border-t pt-4 space-y-2"
              style={{ borderColor: "var(--border-light)" }}
            >
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
                    이 {LABEL.member}에게 팀장 위임
                  </button>
                  {onRemoveMember && (
                    <button
                      onClick={handleRemove}
                      disabled={loading}
                      className="w-full rounded-lg border py-2.5 text-sm font-medium disabled:opacity-50"
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
                    className="text-sm text-center"
                    style={{ color: "var(--text-secondary)" }}
                  >
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
      ) : (
        <div className="max-h-[60vh] overflow-y-auto space-y-2 -mx-2 px-2">
          {members.map((member) => (
            <button
              key={member.profile.id}
              onClick={() => setSelectedId(member.profile.id)}
              className="interactive-press flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.profile.display_name}
                </span>
                {member.profile.id === leaderId && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--text-on-primary)",
                    }}
                  >
                    팀장
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                상세 →
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
