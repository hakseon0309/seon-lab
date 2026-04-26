"use client";

import { NotificationRow } from "@/lib/types";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status: number };

type JsonRecord = Record<string, unknown>;
type NotificationSnapshot = {
  notifications: NotificationRow[];
  unreadCount: number;
};

const SNAPSHOT_TTL_MS = 15_000;

let notificationSnapshotCache:
  | (NotificationSnapshot & { fetchedAt: number })
  | null = null;
let inflightSnapshotPromise: Promise<ApiResult<NotificationSnapshot>> | null =
  null;

async function requestNotificationApi<T>(
  input: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, init);
    const data = (await response.json().catch(() => ({}))) as JsonRecord;

    if (!response.ok) {
      return {
        ok: false,
        error:
          typeof data.error === "string"
            ? data.error
            : "요청 처리에 실패했습니다",
        code: typeof data.code === "string" ? data.code : undefined,
        status: response.status,
      };
    }

    return { ok: true, data: data as T };
  } catch {
    return {
      ok: false,
      error: "네트워크 요청에 실패했습니다",
      code: "network_error",
      status: 0,
    };
  }
}

function writeSnapshotCache(data: NotificationSnapshot) {
  notificationSnapshotCache = {
    ...data,
    fetchedAt: Date.now(),
  };
}

function isFreshSnapshot() {
  if (!notificationSnapshotCache) return false;
  return Date.now() - notificationSnapshotCache.fetchedAt < SNAPSHOT_TTL_MS;
}

export function readCachedNotificationSnapshot(): NotificationSnapshot | null {
  if (!notificationSnapshotCache) return null;
  return {
    notifications: notificationSnapshotCache.notifications,
    unreadCount: notificationSnapshotCache.unreadCount,
  };
}

export function hasFreshNotificationSnapshot() {
  return isFreshSnapshot();
}

export function mutateCachedNotificationSnapshot(
  updater: (snapshot: NotificationSnapshot) => NotificationSnapshot
) {
  if (!notificationSnapshotCache) return;
  writeSnapshotCache(
    updater({
      notifications: notificationSnapshotCache.notifications,
      unreadCount: notificationSnapshotCache.unreadCount,
    })
  );
}

export async function loadNotificationSnapshot(options?: {
  preferCache?: boolean;
  force?: boolean;
}) {
  if (!options?.force && notificationSnapshotCache) {
    if (options?.preferCache || isFreshSnapshot()) {
      return {
        ok: true as const,
        data: {
          notifications: notificationSnapshotCache.notifications,
          unreadCount: notificationSnapshotCache.unreadCount,
        },
      };
    }
  }

  if (!options?.force && inflightSnapshotPromise) {
    return inflightSnapshotPromise;
  }

  inflightSnapshotPromise = requestNotificationApi<NotificationSnapshot>(
    "/api/notifications",
    { cache: "no-store" }
  ).then((result) => {
    if (result.ok) {
      writeSnapshotCache(result.data);
    }
    inflightSnapshotPromise = null;
    return result;
  });

  return inflightSnapshotPromise;
}

export function markAllNotificationsRead() {
  return requestNotificationApi<{ success?: true }>(
    "/api/notifications/read-all",
    { method: "PATCH" }
  );
}

export function markNotificationRead(id: string) {
  return requestNotificationApi<{ success?: true }>(
    `/api/notifications/${id}/read`,
    { method: "PATCH" }
  );
}

export function labelForNotificationKind(kind: NotificationRow["kind"]) {
  return kind === "message" ? "메시지" : "댓글";
}
