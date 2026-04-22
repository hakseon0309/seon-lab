"use client";

import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/modal";

interface Props {
  ownedTeams: { id: string; name: string }[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const CONFIRM_PHRASE = "삭제합니다";

export default function DeleteAccountModal({ ownedTeams, onClose, onConfirm }: Props) {
  const [phrase, setPhrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasOwnedTeams = ownedTeams.length > 0;
  const canSubmit = !hasOwnedTeams && phrase === CONFIRM_PHRASE && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈퇴 처리에 실패했습니다");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="회원 탈퇴" onClose={onClose}>
      {hasOwnedTeams ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              아래 팀의 팀장으로 있어 탈퇴할 수 없습니다. 팀장을 다른 멤버에게 위임한 뒤 다시 시도해주세요.
            </p>
            <ul className="space-y-2">
              {ownedTeams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/teams/${team.id}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--border-light)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span>{team.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>이동 →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>탈퇴 시 아래 데이터가 모두 삭제됩니다.</p>
              <ul className="list-disc pl-5 text-xs" style={{ color: "var(--text-muted)" }}>
                <li>프로필 및 캘린더 구독 정보</li>
                <li>동기화된 시프트 이벤트</li>
                <li>팀 가입 내역</li>
                <li>커플 연결 (상대방은 자동으로 해제됩니다)</li>
              </ul>
              <p className="pt-1">
                계속하려면 아래에{" "}
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {CONFIRM_PHRASE}
                </span>
                을(를) 정확히 입력해주세요.
              </p>
            </div>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
                "--tw-ring-color": "var(--error)",
              } as React.CSSProperties}
              autoFocus
            />
            {error && (
              <p className="text-xs" style={{ color: "var(--error)" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border py-2 text-sm"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--error)",
                  color: "var(--text-on-primary)",
                }}
              >
                {submitting ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </form>
        )}
    </Modal>
  );
}
