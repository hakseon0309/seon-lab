"use client";

import AvatarImage from "@/components/avatar-image";
import Modal from "@/components/modal";
import PostStatusBadge from "@/components/post-status-badge";
import { useToast } from "@/components/toast-provider";
import { createClient } from "@/lib/supabase/client";
import { formatPostedAt } from "@/lib/time";
import { formatPreviewTitle } from "@/components/swap-board-view";
import {
  Board,
  BoardMessage,
  BoardPost,
  SwapEvent,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  board: Board;
  initialPost: BoardPost & {
    team_id: string;
    swap_date: string | null;
    swap_status: "open" | "done";
    completed_at: string | null;
  };
  initialMessages: BoardMessage[];
  postAuthorName: string;
  postAuthorAvatar: string | null;
  teamName: string;
  swapEvent: SwapEvent | null;
  currentUserId: string;
  canEdit: boolean;
  canDelete: boolean;
}

export default function ChatPostView({
  board,
  initialPost,
  initialMessages,
  postAuthorName,
  postAuthorAvatar,
  teamName,
  swapEvent,
  currentUserId,
  canEdit,
  canDelete,
}: Props) {
  const [post, setPost] = useState(initialPost);
  const [messages, setMessages] = useState<BoardMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  const toast = useToast();
  const router = useRouter();
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeaderSlot(document.getElementById("post-header-actions"));
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Realtime 메시지 구독
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`board_messages:${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "board_messages",
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          const m = payload.new as BoardMessage;
          // 내가 방금 보낸 메시지는 submit 쪽에서 이미 추가했으므로 중복 방지
          if (m.author_id === currentUserId) return;
          // 작성자 프로필 가져와 이름/아바타 세팅
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("display_name, avatar_url")
            .eq("id", m.author_id)
            .maybeSingle();
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [
              ...prev,
              {
                ...m,
                author_name: profile?.display_name || "이름 없음",
                author_avatar_url: profile?.avatar_url ?? null,
              },
            ];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, currentUserId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (body.length < 1) return;
    if (post.swap_status === "done") {
      toast.error("완료된 글에는 메시지를 보낼 수 없어요");
      return;
    }
    setSending(true);
    const res = await fetch(
      `/api/boards/shift-swap/posts/${post.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      toast.error(data.error || "메시지 전송에 실패했습니다");
      return;
    }
    setMessages((prev) => [...prev, data.message as BoardMessage]);
    setInput("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSavingEdit(true);
    const res = await fetch(
      `/api/boards/${board.slug}/posts/${post.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setSavingEdit(false);
    if (!res.ok) {
      toast.error(data.error || "수정에 실패했습니다");
      return;
    }
    setPost((p) => ({ ...p, title: editTitle, body: editBody }));
    setEditing(false);
    toast.success("글을 수정했습니다");
    router.refresh();
  }

  async function deletePost() {
    if (!confirm("이 글을 삭제할까요? 대화 내역도 함께 사라집니다.")) return;
    setDeleting(true);
    const res = await fetch(
      `/api/boards/${board.slug}/posts/${post.id}`,
      { method: "DELETE" }
    );
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      toast.error(data.error || "삭제에 실패했습니다");
      return;
    }
    toast.success("글을 삭제했습니다");
    router.push(`/boards/${board.slug}`);
    router.refresh();
  }

  async function toggleComplete(next: "open" | "done") {
    setTogglingStatus(true);
    const res = await fetch(
      `/api/boards/shift-swap/posts/${post.id}/complete`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setTogglingStatus(false);
    setConfirmingComplete(false);
    if (!res.ok) {
      toast.error(data.error || "상태 변경에 실패했습니다");
      return;
    }
    setPost((p) => ({
      ...p,
      swap_status: next,
      completed_at: next === "done" ? new Date().toISOString() : null,
    }));
    toast.success(next === "done" ? "완료로 변경했습니다" : "다시 진행중으로 되돌렸어요");
    router.refresh();
  }

  // 팻핑거 방지 — 버튼 자체를 키우고(최소 44x40) 버튼 사이 간격도 넓힘.
  const headerActions = (canEdit || canDelete) && (
    <div className="flex items-center gap-2">
      {canEdit && post.swap_status === "open" && (
        <button
          type="button"
          onClick={() => {
            setEditTitle(post.title);
            setEditBody(post.body);
            setEditing(true);
          }}
          className="interactive-press rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--button-surface)",
            color: "var(--text-primary)",
          }}
        >
          수정
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() =>
            post.swap_status === "open"
              ? setConfirmingComplete(true)
              : toggleComplete("open")
          }
          disabled={togglingStatus}
          className="interactive-press rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
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
          onClick={deletePost}
          disabled={deleting}
          className="interactive-press rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--error-bg)",
            color: "var(--error)",
          }}
        >
          {deleting ? "삭제 중…" : "삭제"}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      {headerSlot && headerActions && createPortal(headerActions, headerSlot)}

      {/* 작성자 정보 카드 — 2줄 구조
          윗줄: 26. 04. 25 (토) 09:45 – 18:45 로 제목
          아랫줄: [아바타] 작성자 · 팀 · 작성시각   [상태] */}
      <div
        className="mx-4 mt-2 rounded-lg border p-4 lg:mx-0"
        style={{
          borderColor: "var(--border-light)",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {formatPreviewTitle(post.swap_date, swapEvent, post.title)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <AvatarImage
            src={postAuthorAvatar}
            name={postAuthorName}
            sizeClass="h-7 w-7"
          />
          <p
            className="min-w-0 flex-1 truncate text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {postAuthorName} · {teamName} · {formatPostedAt(post.created_at)}
          </p>
          <PostStatusBadge status={post.swap_status} className="shrink-0" />
        </div>

        <p
          className="mt-4 whitespace-pre-wrap text-sm leading-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {post.body}
        </p>
      </div>

      {/* 메시지 영역 */}
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
            {messages.map((m) => {
              const mine = m.author_id === currentUserId;
              return (
                <li
                  key={m.id}
                  className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
                >
                  {/* 발신/수신 모두 양쪽에 아바타 표시 */}
                  <AvatarImage
                    src={m.author_avatar_url ?? null}
                    name={m.author_name || "이름 없음"}
                    sizeClass="h-7 w-7"
                  />
                  <div
                    className={`max-w-[75%] ${
                      mine ? "items-end" : "items-start"
                    } flex min-w-0 flex-col`}
                  >
                    <span
                      className="mb-0.5 truncate text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {m.author_name}
                    </span>
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
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                    <span
                      className="mt-0.5 text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatPostedAt(m.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={listEndRef} />
      </section>

      {/* 입력창 */}
      <form
        onSubmit={send}
        className="mx-4 mt-4 flex gap-2 lg:mx-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={post.swap_status === "done"}
          placeholder={
            post.swap_status === "done"
              ? "완료된 글입니다"
              : "메시지 입력…"
          }
          maxLength={4000}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
          style={
            {
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties
          }
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0 || post.swap_status === "done"}
          className="interactive-press shrink-0 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          전송
        </button>
      </form>

      {/* 완료 확인 모달 */}
      {confirmingComplete && (
        <Modal
          title="완료로 변경할까요?"
          onClose={() => setConfirmingComplete(false)}
        >
          <div className="space-y-4">
            <ul
              className="space-y-1.5 rounded-lg border p-3 text-xs leading-5"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              <li>• 더 이상 메시지를 주고받을 수 없어요.</li>
              <li>• 지금까지의 대화 내용은 7일 후 자정에 자동 삭제됩니다.</li>
              <li>• 필요하면 다시 진행중으로 되돌릴 수 있어요.</li>
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingComplete(false)}
                disabled={togglingStatus}
                className="interactive-press flex-1 rounded-lg border py-2.5 text-sm disabled:opacity-50"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => toggleComplete("done")}
                disabled={togglingStatus}
                className="interactive-press flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                }}
              >
                {togglingStatus ? "처리 중…" : "완료로 변경"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 글 수정 모달 */}
      {editing && (
        <Modal title="글 수정" onClose={() => setEditing(false)} maxWidth="max-w-lg">
          <form onSubmit={saveEdit} className="space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={
                {
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                  "--tw-ring-color": "var(--primary)",
                } as React.CSSProperties
              }
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2"
              style={
                {
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--input-text)",
                  "--tw-ring-color": "var(--primary)",
                } as React.CSSProperties
              }
            />
            <button
              type="submit"
              disabled={savingEdit}
              className="interactive-press w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-on-primary)",
              }}
            >
              {savingEdit ? "저장 중…" : "저장"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// 로컬 유틸은 time.ts 의 formatSwapDateShort / formatShiftRange /
// swap-board-view 의 formatPreviewTitle 로 통합됨.
