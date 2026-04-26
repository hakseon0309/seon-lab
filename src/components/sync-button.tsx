"use client";

import { useToast } from "@/components/toast-provider";
import { requestCalendarSync } from "@/lib/calendar-sync-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SyncButtonProps {
  lastSynced: string | null;
}

export default function SyncButton({ lastSynced }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();

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

    const result = await requestCalendarSync();
    if (!result.ok) {
      if (result.code === "cooldown" && result.remainingMinutes) {
        setRemaining(result.remainingMinutes);
      }
      setError(result.error || "동기화에 실패했습니다");
      toast[result.code === "cooldown" ? "info" : "error"](
        result.error || "동기화에 실패했습니다"
      );
      setLoading(false);
      return;
    }

    toast.success(
      typeof result.synced === "number"
        ? `${result.synced}개의 시프트를 불러왔어요`
        : "동기화가 완료됐어요"
    );
    try {
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || remaining > 0;

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <span className="text-xs" style={{ color: "var(--error)" }}>
          {error}
        </span>
      ) : remaining > 0 ? (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {remaining}분 후 가능
        </span>
      ) : null}
      <button
        onClick={handleSync}
        disabled={disabled}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-card)",
        }}
      >
        {loading ? "동기화 중..." : "새로고침"}
      </button>
    </div>
  );
}
