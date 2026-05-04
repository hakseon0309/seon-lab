"use client";

import NotificationPanel from "@/components/notification-panel";
import { useClientReady } from "@/lib/client-dom";
import {
  hasFreshNotificationSnapshot,
  loadNotificationSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  mutateCachedNotificationSnapshot,
  readCachedNotificationSnapshot,
} from "@/lib/notification-client";
import { createClient } from "@/lib/supabase/client";
import { NotificationRow } from "@/lib/types";
import {
  broadcastOverlayOpen,
  onOtherOverlayOpen,
} from "@/lib/overlay-bus";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function NotificationBell() {
  const mounted = useClientReady();
  const initialSnapshot = readCachedNotificationSnapshot();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialSnapshot?.unreadCount ?? 0);
  const [items, setItems] = useState<NotificationRow[]>(
    initialSnapshot?.notifications ?? []
  );
  const [loading, setLoading] = useState(false);

  function applySnapshot(snapshot: {
    notifications: NotificationRow[];
    unreadCount: number;
  }) {
    setItems(snapshot.notifications ?? []);
    setCount(Number(snapshot.unreadCount) || 0);
  }

  const loadNotifications = useCallback(async (options?: {
    preferCache?: boolean;
    force?: boolean;
  }) => {
    setLoading(true);
    const result = await loadNotificationSnapshot(options);
    if (result.ok) {
      applySnapshot(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let idleCallbackId: number | null = null;
    let warmupTimeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;

      const cached = readCachedNotificationSnapshot();
      if (cached) {
        applySnapshot(cached);
      }

      await loadNotifications({ preferCache: true });
      if (cancelled) return;

      const scheduleWarmup = () => {
        if (cancelled || hasFreshNotificationSnapshot()) return;
        void loadNotifications({ force: true });
      };

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(scheduleWarmup, {
          timeout: 1500,
        });
      } else {
        warmupTimeoutId = globalThis.setTimeout(scheduleWarmup, 250);
      }

      const topic = `notifications:${auth.user.id}`;
      const realtimeTopic = `realtime:${topic}`;
      const existingChannel = supabase
        .getChannels()
        .find((candidate) => candidate.topic === realtimeTopic);

      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
        if (cancelled) return;
      }

      channel = supabase.channel(topic);
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${auth.user.id}`,
          },
          () => {
            void loadNotifications({ force: true });
          }
        )
        .subscribe();
    }

    void init();

    return () => {
      cancelled = true;
      if (
        idleCallbackId !== null &&
        typeof window !== "undefined" &&
        "cancelIdleCallback" in window
      ) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (warmupTimeoutId !== null) {
        clearTimeout(warmupTimeoutId);
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown };
      if (data?.type !== "seon-lab:push-notification") return;
      void loadNotifications({ force: true });
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  useEffect(() => {
    return onOtherOverlayOpen("notifications", () => setOpen(false));
  }, []);

  async function handleMarkAllRead() {
    const result = await markAllNotificationsRead();
    if (!result.ok) return;

    const readAt = new Date().toISOString();
    setItems((prev) => {
      const next = prev.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? readAt,
        unread_count: 0,
      }));
      mutateCachedNotificationSnapshot((snapshot) => ({
        ...snapshot,
        notifications: next,
        unreadCount: 0,
      }));
      return next;
    });
    setCount(0);
  }

  function handleNotificationOpen(notification: NotificationRow) {
    if (notification.read_at) return;

    void markNotificationRead(notification.id);
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              read_at: new Date().toISOString(),
              unread_count: 0,
            }
          : item
      );
      mutateCachedNotificationSnapshot((snapshot) => ({
        ...snapshot,
        notifications: next,
        unreadCount: Math.max(0, snapshot.unreadCount - 1),
      }));
      return next;
    });
    setCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <>
      <button
        type="button"
        aria-label="알림 열기"
        onClick={() => {
          broadcastOverlayOpen("notifications");
          setOpen(true);
          if (items.length === 0) {
            void loadNotifications({ preferCache: true });
          } else if (!hasFreshNotificationSnapshot()) {
            void loadNotifications({ force: true });
          }
        }}
        className="interactive-press relative flex h-9 w-9 items-center justify-center rounded-md"
        style={{ color: "var(--text-primary)" }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
            style={{
              backgroundColor: "var(--error)",
              color: "var(--text-on-primary)",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {mounted &&
        open &&
        createPortal(
          <NotificationPanel
            count={count}
            items={items}
            loading={loading}
            onClose={() => setOpen(false)}
            onMarkAllRead={handleMarkAllRead}
            onNotificationOpen={handleNotificationOpen}
          />,
          document.body
        )}
    </>
  );
}
