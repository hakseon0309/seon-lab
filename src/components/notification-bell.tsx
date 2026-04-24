"use client";

import Link from "next/link";
import AvatarImage from "@/components/avatar-image";
import { createClient } from "@/lib/supabase/client";
import { formatPostedAt } from "@/lib/time";
import { NotificationRow } from "@/lib/types";
import {
  broadcastOverlayOpen,
  onOtherOverlayOpen,
} from "@/lib/overlay-bus";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 내 unread-count 로드 + Realtime 구독
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      userIdRef.current = auth.user.id;

      await refreshCount();

      const channel = supabase
        .channel(`notifications:${auth.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${auth.user.id}`,
          },
          () => {
            refreshCount();
            // 드롭다운이 열려 있다면 목록도 갱신
            if (openRef.current) loadList();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanup = init();
    return () => {
      cancelled = true;
      cleanup.then((fn) => fn?.());
    };
  }, []);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    loadList();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  // 다른 오버레이(사이드바)가 열리면 자신을 닫는다.
  useEffect(() => {
    return onOtherOverlayOpen("notifications", () => setOpen(false));
  }, []);

  async function refreshCount() {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data.count) || 0);
    } catch {
      // ignore
    }
  }

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems((data.notifications ?? []) as NotificationRow[]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? new Date().toISOString(),
        unread_count: 0,
      }))
    );
    setCount(0);
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }

  function targetHref(n: NotificationRow): string {
    if (!n.board_slug || !n.post_id) return "#";
    return `/boards/${n.board_slug}/${n.post_id}`;
  }

  return (
    <>
      <button
        type="button"
        aria-label="알림 열기"
        onClick={() => {
          broadcastOverlayOpen("notifications");
          setOpen(true);
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

      {mounted && open && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 900 }}
          role="dialog"
          aria-modal="true"
          aria-label="알림"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgb(0 0 0 / 0.5)" }}
          />
          <aside
            className="absolute right-0 top-0 flex h-full w-1/2 flex-col overflow-y-auto border-l lg:w-80"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-light)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--border-light)" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                알림
              </h2>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="interactive-press text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="flex-1">
              {loading && items.length === 0 ? null : items.length === 0 ? (
                <p
                  className="px-4 py-8 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  알림이 없습니다
                </p>
              ) : (
                <ul>
                  {items.map((n) => {
                    const unread = !n.read_at;
                    return (
                      <li key={n.id}>
                        <Link
                          href={targetHref(n)}
                          onClick={() => {
                            if (unread) {
                              markOneRead(n.id);
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === n.id
                                    ? {
                                        ...x,
                                        read_at: new Date().toISOString(),
                                        unread_count: 0,
                                      }
                                    : x
                                )
                              );
                              setCount((c) => Math.max(0, c - 1));
                            }
                          }}
                          className="interactive-press flex items-start gap-3 border-b px-4 py-3"
                          style={{
                            borderColor: "var(--border-light)",
                            backgroundColor: unread
                              ? "var(--primary-light)"
                              : "transparent",
                          }}
                        >
                          <AvatarImage
                            src={null}
                            name={n.last_actor_name || "?"}
                            sizeClass="h-8 w-8"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {n.last_actor_name || "익명"} ·{" "}
                              <span
                                className="font-medium"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {n.post_title}
                              </span>
                            </p>
                            {n.preview && (
                              <p
                                className="mt-0.5 truncate text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {labelForKind(n.kind)} · {n.preview}
                              </p>
                            )}
                            <p
                              className="mt-0.5 text-[11px]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {formatPostedAt(n.updated_at)}
                              {n.unread_count > 1 && (
                                <span className="ml-1">
                                  ({n.unread_count}건)
                                </span>
                              )}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}

function labelForKind(kind: NotificationRow["kind"]): string {
  return kind === "message" ? "메시지" : "댓글";
}
