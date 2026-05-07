"use client";

import Modal from "@/components/modal";
import SwapPostTitleCard from "@/components/swap-post-title-card";
import { useToast } from "@/components/toast-provider";
import {
  createBoardMessage,
  deleteBoardPost,
  loadBoardMessages,
  updateBoardPostCompletion,
} from "@/lib/board-api-client";
import { createClient } from "@/lib/supabase/client";
import { toWorkTerminology } from "@/lib/terminology";
import { formatPostedAt } from "@/lib/time";
import { Board, BoardMessage, SwapPost } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  board: Board;
  post: SwapPost;
  currentUserId: string;
  canDelete: boolean;
  onClose: () => void;
  onPostChanged: (post: SwapPost) => void;
  onDeleted: () => void;
}

interface MessageAuthorProfile {
  display_name: string;
  avatar_url: string | null;
}

function buildAuthorCache(messages: BoardMessage[]) {
  return new Map<string, MessageAuthorProfile>(
    messages
      .filter((message) => message.author_name || message.author_avatar_url)
      .map((message) => [
        message.author_id,
        {
          display_name: message.author_name || "이름 없음",
          avatar_url: message.author_avatar_url ?? null,
        },
      ])
  );
}

function isSameMinute(a: string, b: string) {
  return (
    Math.floor(new Date(a).getTime() / 60000) ===
    Math.floor(new Date(b).getTime() / 60000)
  );
}

function shouldGroupMessages(current: BoardMessage, adjacent?: BoardMessage) {
  if (!adjacent) return false;
  return (
    current.author_id === adjacent.author_id &&
    isSameMinute(current.created_at, adjacent.created_at)
  );
}

export default function SwapPostDetailModal({
  board,
  post: initialPost,
  currentUserId,
  canDelete,
  onClose,
  onPostChanged,
  onDeleted,
}: Props) {
  const [post, setPost] = useState(initialPost);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const authorCacheRef = useRef(new Map<string, MessageAuthorProfile>());
  const listEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const canEdit = post.author_id === currentUserId;

  useEffect(() => {
    let cancelled = false;

    loadBoardMessages(board.slug, post.id).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error || "대화를 불러오지 못했습니다");
        setLoadingMessages(false);
        return;
      }

      authorCacheRef.current = buildAuthorCache(result.data.messages);
      setMessages(result.data.messages);
      setLoadingMessages(false);
    });

    return () => {
      cancelled = true;
    };
  }, [board.slug, post.id, toast]);

  const resolveAuthorProfile = useCallback(async (authorId: string) => {
    const cached = authorCacheRef.current.get(authorId);
    if (cached) return cached;

    const supabase = createClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, avatar_url")
      .eq("id", authorId)
      .maybeSingle();

    const resolved = {
      display_name: profile?.display_name || "이름 없음",
      avatar_url: profile?.avatar_url ?? null,
    };
    authorCacheRef.current.set(authorId, resolved);
    return resolved;
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`board_messages:modal:${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "board_messages",
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          const message = payload.new as BoardMessage;
          if (message.author_id === currentUserId) return;

          const profile = await resolveAuthorProfile(message.author_id);
          setMessages((prev) => {
            if (prev.some((item) => item.id === message.id)) return prev;
            return [
              ...prev,
              {
                ...message,
                author_name: profile.display_name,
                author_avatar_url: profile.avatar_url,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, post.id, resolveAuthorProfile]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function sendBody(body: string) {
    if (body.length === 0) return;
    if (post.swap_status === "done") {
      toast.error("완료된 글에는 메시지를 보낼 수 없어요");
      return;
    }

    setSending(true);
    const result = await createBoardMessage(board.slug, post.id, body);
    setSending(false);

    if (!result.ok) {
      toast.error(result.error || "메시지 전송에 실패했습니다");
      return;
    }

    const message = result.data.message;
    authorCacheRef.current.set(message.author_id, {
      display_name: message.author_name || "이름 없음",
      avatar_url: message.author_avatar_url ?? null,
    });
    setMessages((prev) => [...prev, message]);
  }

  async function toggleComplete(next: "open" | "done") {
    setTogglingStatus(true);
    const result = await updateBoardPostCompletion(board.slug, post.id, next);
    setTogglingStatus(false);

    if (!result.ok) {
      toast.error(result.error || "상태 변경에 실패했습니다");
      return;
    }

    const nextPost = {
      ...post,
      swap_status: next,
      completed_at: next === "done" ? new Date().toISOString() : null,
    };
    setPost(nextPost);
    onPostChanged(nextPost);
    toast.success(next === "done" ? "완료로 변경했습니다" : "다시 진행중으로 되돌렸어요");
  }

  async function removePost() {
    setDeleting(true);
    const result = await deleteBoardPost(board.slug, post.id);
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error || "삭제에 실패했습니다");
      return;
    }

    toast.success("글을 삭제했습니다");
    onDeleted();
  }
  const canQuickApply =
    !canEdit &&
    post.swap_status === "open" &&
    !messages.some((message) => message.author_id === currentUserId);

  return (
    <Modal
      title="근무 교환"
      onClose={onClose}
      maxWidth="max-w-lg"
      panelClassName="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5"
      panelStyle={{
        width: "calc(100% - 3rem)",
        maxWidth: "32rem",
      }}
      header={
        <div className="flex items-center justify-between gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            근무 교환
          </h3>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  toggleComplete(post.swap_status === "open" ? "done" : "open")
                }
                disabled={togglingStatus}
                className="interactive-press rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                style={
                  post.swap_status === "open"
                    ? {
                        backgroundColor: "var(--success-bg)",
                        color: "var(--success)",
                      }
                    : {
                        backgroundColor: "var(--event-bg)",
                        color: "var(--event-text)",
                      }
                }
              >
                {post.swap_status === "open" ? "완료" : "진행중으로"}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={removePost}
                disabled={deleting}
                className="interactive-press rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error)",
                }}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex max-h-[78vh] flex-col">
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <SwapPostTitleCard post={post} variant="detail" />
        </div>

        <section className="mt-4">
          <h4
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            대화
          </h4>
          <div
            className="relative h-[14.5rem] overflow-y-auto rounded-xl border px-3 py-3"
            style={{
              borderColor: "var(--border-light)",
              backgroundColor: "var(--bg-surface)",
              scrollbarGutter: "stable both-edges",
            }}
            aria-busy={loadingMessages}
          >
            {loadingMessages && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}
            {!loadingMessages && messages.length === 0 ? (
              <p
                className="py-8 text-center text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                아직 메시지가 없어요
              </p>
            ) : (
              <MessageList messages={messages} currentUserId={currentUserId} />
            )}
            <div ref={listEndRef} />
          </div>
        </section>

        {canQuickApply && (
          <button
            type="button"
            onClick={() => sendBody("교환 신청합니다.")}
            disabled={sending}
            className="interactive-press mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--success-bg)",
              color: "var(--success)",
            }}
          >
            교환 신청
          </button>
        )}

      </div>
    </Modal>
  );
}

function MessageList({
  messages,
  currentUserId,
}: {
  messages: BoardMessage[];
  currentUserId: string;
}) {
  return (
    <ul className="flex min-h-full flex-col justify-end gap-1.5 pr-1">
      {messages.map((message, index) => {
        const mine = message.author_id === currentUserId;
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const groupedWithPrev = shouldGroupMessages(message, prev);
        const groupedWithNext = shouldGroupMessages(message, next);
        const showAuthor = !mine && !groupedWithPrev;
        const showTime = !groupedWithNext;

        return (
          <li
            key={message.id}
            className={`flex w-full ${
              groupedWithPrev ? "mt-0.5" : "mt-3"
            } ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[78%] min-w-0 flex-col ${
                mine ? "items-end" : "items-start"
              }`}
            >
              {showAuthor && (
                <span
                  className="mb-1 max-w-full truncate px-1 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {message.author_name || "이름 없음"}
                </span>
              )}
              <div
                className={`px-3 py-2 text-sm leading-6 ${
                  mine
                    ? groupedWithNext
                      ? "rounded-2xl rounded-br-md"
                      : "rounded-2xl"
                    : groupedWithNext
                      ? "rounded-2xl rounded-bl-md"
                      : "rounded-2xl"
                }`}
                style={{
                  backgroundColor: mine ? "var(--event-bg)" : "var(--bg-card)",
                  border: mine ? "none" : "1px solid var(--border-light)",
                  color: mine ? "var(--event-text)" : "var(--text-primary)",
                }}
              >
                <p className="whitespace-pre-wrap break-words">
                  {toWorkTerminology(message.body)}
                </p>
              </div>
              {showTime && (
                <span
                  className="mt-1 px-1 text-[10px]"
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
  );
}
