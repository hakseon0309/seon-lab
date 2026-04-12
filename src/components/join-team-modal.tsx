"use client";

import { useState } from "react";
import QrScanner from "./qr-scanner";

interface JoinTeamModalProps {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export default function JoinTeamModal({ onClose, onJoin }: JoinTeamModalProps) {
  const [mode, setMode] = useState<"select" | "code" | "qr">("select");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("6자리 코드를 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onJoin(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "팀 가입에 실패했습니다");
      setLoading(false);
    }
  }

  async function handleQrScan(scannedCode: string) {
    setMode("select");
    setLoading(true);
    setError("");
    try {
      await onJoin(scannedCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "팀 가입에 실패했습니다");
      setLoading(false);
    }
  }

  if (mode === "qr") {
    return <QrScanner onScan={handleQrScan} onClose={() => setMode("select")} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            팀 참여하기
          </h3>
          <button
            onClick={onClose}
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            닫기
          </button>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg p-3 text-sm"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
          >
            {error}
          </div>
        )}

        {mode === "select" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("code")}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--border-light)" }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                #
              </span>
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  코드 입력
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  6자리 초대 코드를 입력하세요
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("qr")}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--border-light)" }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{
                  backgroundColor: "var(--secondary-light)",
                  color: "var(--secondary)",
                }}
              >
                {"\u25a3"}
              </span>
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  QR 코드 스캔
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  카메라로 QR 코드를 스캔하세요
                </div>
              </div>
            </button>

            {loading && (
              <p
                className="text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                참여 중...
              </p>
            )}
          </div>
        )}

        {mode === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                초대 코드
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-lg border px-3 py-2.5 text-center text-2xl font-mono tracking-[0.3em] uppercase shadow-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                  "--tw-ring-color": "var(--primary)",
                } as React.CSSProperties}
                placeholder="______"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                뒤로
              </button>
              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                }}
              >
                {loading ? "참여 중..." : "참여하기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
