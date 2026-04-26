"use client";

export interface CalendarSyncResult {
  ok: boolean;
  status: number;
  code?: string;
  error?: string;
  synced?: number;
  remainingMinutes?: number;
}

export async function requestCalendarSync(): Promise<CalendarSyncResult> {
  try {
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    return {
      ok: res.ok,
      status: res.status,
      code: typeof data.code === "string" ? data.code : undefined,
      error: typeof data.error === "string" ? data.error : undefined,
      synced: typeof data.synced === "number" ? data.synced : undefined,
      remainingMinutes:
        typeof data.remaining_minutes === "number"
          ? data.remaining_minutes
          : undefined,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "network_error",
      error: "동기화에 실패했습니다",
    };
  }
}
