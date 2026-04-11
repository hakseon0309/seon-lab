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

  // QR 스캔 모드
  if (mode === "qr") {
    return <QrScanner onScan={handleQrScan} onClose={() => setMode("select")} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">팀 참여하기</h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            닫기
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {mode === "select" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("code")}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                #
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">코드 입력</div>
                <div className="text-xs text-gray-500">6자리 초대 코드를 입력하세요</div>
              </div>
            </button>

            <button
              onClick={() => setMode("qr")}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                {"\u25a3"}
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">QR 코드 스캔</div>
                <div className="text-xs text-gray-500">카메라로 QR 코드를 스캔하세요</div>
              </div>
            </button>

            {loading && (
              <p className="text-center text-sm text-gray-400">참여 중...</p>
            )}
          </div>
        )}

        {mode === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                초대 코드
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl font-mono tracking-[0.3em] uppercase shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="______"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                뒤로
              </button>
              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
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
