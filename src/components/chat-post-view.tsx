"use client";

import ChatComposer from "@/components/chat-composer";
import ChatMessageThread from "@/components/chat-message-thread";
import ChatPostCard from "@/components/chat-post-card";
import { ChatCompleteModal, ChatEditModal } from "@/components/chat-post-modals";
import ConfirmModal from "@/components/confirm-modal";
import { useToast } from "@/components/toast-provider";
import {
  createBoardMessage,
  deleteBoardPost,
  updateBoardPost,
  updateBoardPostCompletion,
} from "@/lib/board-api-client";
import { usePortalTarget } from "@/lib/client-dom";
import { createClient } from "@/lib/supabase/client";
import { formatPreviewTitle } from "@/lib/swap-board";
import { toWorkTerminology } from "@/lib/terminology";
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

interface MessageAuthorProfile {
  display_name: string;
  avatar_url: string | null;
}

function buildInitialAuthorCache(messages: BoardMessage[]) {
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
  const [editTitle, setEditTitle] = useState(toWorkTerminology(post.title));
  const [editBody, setEditBody] = useState(toWorkTerminology(post.body));
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDeletePost, setConfirmingDeletePost] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const toast = useToast();
  const router = useRouter();
  const listEndRef = useRef<HTMLDivElement>(null);
  const authorCacheRef = useRef(buildInitialAuthorCache(initialMessages));
  const headerSlot = usePortalTarget("post-header-actions");

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function resolveAuthorProfile(authorId: string) {
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
  }

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
  }, [currentUserId, post.id]);

  async function sendBody(body: string) {
    if (body.length < 1) return;
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

    const message = result.data.message as BoardMessage;
    authorCacheRef.current.set(message.author_id, {
      display_name: message.author_name || "이름 없음",
      avatar_url: message.author_avatar_url ?? null,
    });
    setMessages((prev) => [...prev, message]);
    setInput("");
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    await sendBody(input.trim());
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    setSavingEdit(true);
    const result = await updateBoardPost(board.slug, post.id, {
      title: editTitle,
      body: editBody,
    });
    setSavingEdit(false);

    if (!result.ok) {
      toast.error(result.error || "수정에 실패했습니다");
      return;
    }

    setPost((prev) => ({ ...prev, title: editTitle, body: editBody }));
    setEditing(false);
    toast.success("글을 수정했습니다");
    router.refresh();
  }

  async function deletePost() {
    setDeleting(true);
    const result = await deleteBoardPost(board.slug, post.id);
    setDeleting(false);
    setConfirmingDeletePost(false);

    if (!result.ok) {
      toast.error(result.error || "삭제에 실패했습니다");
      return;
    }

    toast.success("글을 삭제했습니다");
    router.push(`/boards/${board.slug}`);
  }

  async function toggleComplete(next: "open" | "done") {
    setTogglingStatus(true);
    const result = await updateBoardPostCompletion(board.slug, post.id, next);
    setTogglingStatus(false);
    setConfirmingComplete(false);

    if (!result.ok) {
      toast.error(result.error || "상태 변경에 실패했습니다");
      return;
    }

    setPost((prev) => ({
      ...prev,
      swap_status: next,
      completed_at: next === "done" ? new Date().toISOString() : null,
    }));
    toast.success(next === "done" ? "완료로 변경했습니다" : "다시 진행중으로 되돌렸어요");
    router.refresh();
  }

  const headerActions = (canEdit || canDelete) && (
    <div className="flex items-center gap-2">
      {canEdit && post.swap_status === "open" && (
        <button
          type="button"
          onClick={() => {
            setEditTitle(toWorkTerminology(post.title));
            setEditBody(toWorkTerminology(post.body));
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
          onClick={() => setConfirmingDeletePost(true)}
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
  const canQuickApply =
    !canEdit &&
    post.swap_status === "open" &&
    !messages.some((message) => message.author_id === currentUserId);

  return (
    <div className="flex flex-col">
      {headerSlot && headerActions && createPortal(headerActions, headerSlot)}

      <ChatPostCard
        title={formatPreviewTitle(post.swap_date, swapEvent, post.title)}
        body={post.body}
        createdAt={post.created_at}
        authorName={postAuthorName}
        authorAvatar={postAuthorAvatar}
        teamName={teamName}
        status={post.swap_status}
      />

      <ChatMessageThread
        currentUserId={currentUserId}
        messages={messages}
      />
      <div ref={listEndRef} />

      {canQuickApply && (
        <div className="mx-4 mt-4 lg:mx-0">
          <button
            type="button"
            onClick={() => sendBody("교환 신청합니다.")}
            disabled={sending}
            className="interactive-press w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--success-bg)",
              color: "var(--success)",
            }}
          >
            교환 신청
          </button>
        </div>
      )}

      <ChatComposer
        value={input}
        sending={sending}
        disabled={post.swap_status === "done"}
        onChange={setInput}
        onSubmit={send}
      />

      <ChatCompleteModal
        open={confirmingComplete}
        loading={togglingStatus}
        onClose={() => setConfirmingComplete(false)}
        onConfirm={() => toggleComplete("done")}
      />

      <ChatEditModal
        open={editing}
        title={editTitle}
        body={editBody}
        saving={savingEdit}
        onClose={() => setEditing(false)}
        onChangeTitle={setEditTitle}
        onChangeBody={setEditBody}
        onSubmit={saveEdit}
      />

      {confirmingDeletePost && (
        <ConfirmModal
          title="글 삭제"
          description="이 글을 삭제할까요? 대화 내역도 함께 사라집니다."
          confirmLabel="삭제하기"
          destructive
          loading={deleting}
          onClose={() => setConfirmingDeletePost(false)}
          onConfirm={deletePost}
        />
      )}
    </div>
  );
}
