"use client";

import { useState, useEffect } from "react";

interface SyncButtonProps {
  lastSynced: string | null;
  onSync: () => void;
}

export default function SyncButton({ lastSynced, onSync }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!lastSynced) return;

    function calcRemaining() {
      const elapsed = Date.now() - new Date(lastSynced!).getTime();
      const cooldown = 30 * 60 * 1000;
      const left = Math.max(0, Math.ceil((cooldown - elapsed) / 60000));
      setRemaining(left);
    }

    calcRemaining();
    const interval = setInterval(calcRemaining, 30000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  async function handleSync() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setRemaining(data.remaining_minutes);
        }
        setError(data.error);
        return;
      }

      onSync();
    } catch {
      setError("동기화에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || remaining > 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={disabled}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? "동기화 중..." : "새로고침"}
      </button>
      {remaining > 0 && (
        <span className="text-xs text-gray-400">{remaining}분 후 가능</span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
