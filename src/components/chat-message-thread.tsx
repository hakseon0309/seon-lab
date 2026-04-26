"use client";

import AvatarImage from "@/components/avatar-image";
import { formatPostedAt } from "@/lib/time";
import { BoardMessage } from "@/lib/types";

interface Props {
  currentUserId: string;
  messages: BoardMessage[];
}

function isSameMinute(a: string, b: string) {
  return Math.floor(new Date(a).getTime() / 60000) === Math.floor(new Date(b).getTime() / 60000);
}

function shouldGroupMessages(current: BoardMessage, adjacent?: BoardMessage) {
  if (!adjacent) return false;
  return current.author_id === adjacent.author_id && isSameMinute(current.created_at, adjacent.created_at);
}

export default function ChatMessageThread({
  currentUserId,
  messages,
}: Props) {
  return (
    <section className="mx-4 mt-6 flex-1 lg:mx-0">
      <h2
        className="mb-3 text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        대화
      </h2>
      {messages.length === 0 ? (
        <p
          className="py-6 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          아직 메시지가 없어요
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message, index) => {
            const mine = message.author_id === currentUserId;
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const groupedWithPrev = shouldGroupMessages(message, prev);
            const groupedWithNext = shouldGroupMessages(message, next);
            const showMeta = !groupedWithNext;

            return (
              <li
                key={message.id}
                className={`flex gap-2 ${groupedWithPrev ? "mt-1" : ""} ${mine ? "flex-row-reverse" : ""}`}
              >
                {showMeta ? (
                  <AvatarImage
                    src={message.author_avatar_url ?? null}
                    name={message.author_name || "이름 없음"}
                    sizeClass="h-7 w-7"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0" aria-hidden="true" />
                )}
                <div
                  className={`max-w-[75%] ${
                    mine ? "items-end" : "items-start"
                  } flex min-w-0 flex-col`}
                >
                  {showMeta && (
                    <span
                      className="mb-0.5 truncate text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {message.author_name}
                    </span>
                  )}
                  <div
                    className="rounded-2xl px-3 py-2 text-sm leading-6"
                    style={{
                      backgroundColor: mine
                        ? "var(--event-bg)"
                        : "var(--bg-surface)",
                      color: mine
                        ? "var(--event-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </div>
                  {showMeta && (
                    <span
                      className="mt-0.5 text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatPostedAt(message.created_at)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
