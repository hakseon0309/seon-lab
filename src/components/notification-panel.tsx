"use client";

import AvatarImage from "@/components/avatar-image";
import { formatPostedAt } from "@/lib/time";
import { labelForNotificationKind } from "@/lib/notification-client";
import { toWorkTerminology } from "@/lib/terminology";
import { NotificationRow } from "@/lib/types";
import Link from "next/link";

interface Props {
  count: number;
  items: NotificationRow[];
  loading: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationOpen: (notification: NotificationRow) => void;
}

function targetHref(notification: NotificationRow): string {
  if (!notification.board_slug || !notification.post_id) return "#";
  return `/boards/${notification.board_slug}/${notification.post_id}`;
}

export default function NotificationPanel({
  count,
  items,
  loading,
  onClose,
  onMarkAllRead,
  onNotificationOpen,
}: Props) {
  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 900 }}
      role="dialog"
      aria-modal="true"
      aria-label="알림"
      onClick={onClose}
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
        onClick={(event) => event.stopPropagation()}
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
                onClick={onMarkAllRead}
                className="interactive-press text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                모두 읽음
              </button>
            )}
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
              {items.map((notification) => {
                const unread = !notification.read_at;
                return (
                  <li key={notification.id}>
                    <Link
                      href={targetHref(notification)}
                      onClick={() => onNotificationOpen(notification)}
                      className="interactive-press flex items-start gap-3 border-b px-4 py-3"
                      style={{
                        borderColor: "var(--border-light)",
                        backgroundColor: unread
                          ? "var(--primary-light)"
                          : "transparent",
                      }}
                    >
                      <AvatarImage
                        src={notification.last_actor_avatar_url ?? null}
                        name={notification.last_actor_name || "?"}
                        sizeClass="h-8 w-8"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {notification.last_actor_name || "익명"} ·{" "}
                          <span
                            className="font-medium"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {toWorkTerminology(notification.post_title)}
                          </span>
                        </p>
                        {notification.preview && (
                          <p
                            className="mt-0.5 truncate text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {labelForNotificationKind(notification.kind)} ·{" "}
                            {toWorkTerminology(notification.preview)}
                          </p>
                        )}
                        <p
                          className="mt-0.5 text-[11px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {formatPostedAt(notification.updated_at)}
                          {notification.unread_count > 1 && (
                            <span className="ml-1">
                              ({notification.unread_count}건)
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
    </div>
  );
}
