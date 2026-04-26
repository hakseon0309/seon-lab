"use client";

import BoardPostEditorModal from "@/components/board-post-editor-modal";
import Link from "next/link";
import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import { createBoardPost } from "@/lib/board-api-client";
import { Board, BoardPost } from "@/lib/types";
import { usePortalTarget } from "@/lib/client-dom";
import { formatPostedAt } from "@/lib/time";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast-provider";
import { createPortal } from "react-dom";

interface BoardViewProps {
  board: Board;
  initialPosts: BoardPost[];
}

export default function BoardView({ board, initialPosts }: BoardViewProps) {
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const headerSlot = usePortalTarget("board-header-actions");

  const writeButton = (
    <button
      type="button"
      onClick={() => setWriting(true)}
      className="interactive-press shrink-0 rounded-lg px-3 py-2 text-sm font-medium"
      style={{
        backgroundColor: "var(--primary)",
        color: "var(--text-on-primary)",
      }}
    >
      글쓰기
    </button>
  );

  async function submitPost(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await createBoardPost(board.slug, {
      title,
      body,
      isAnonymous,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error || "글 작성에 실패했습니다");
      return;
    }

    setTitle("");
    setBody("");
    setIsAnonymous(false);
    setWriting(false);
    toast.success("글을 등록했습니다");
    router.refresh();
  }

  return (
    <div className="px-4 lg:px-0">
      {headerSlot ? createPortal(writeButton, headerSlot) : null}

      {initialPosts.length === 0 ? (
        <div
          className="rounded-lg border px-4 py-10 text-center"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            아직 등록된 글이 없어요
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            첫 번째 글을 남겨보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {initialPosts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/boards/${board.slug}/${post.id}`}
                className="interactive-press flex items-center gap-3 rounded-lg border px-3 py-3"
                style={{
                  borderColor: "var(--border-light)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <AvatarImage
                  src={post.is_anonymous ? null : post.author_avatar_url ?? null}
                  name={post.author_name || "익명"}
                  sizeClass="h-9 w-9"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {post.is_pinned && (
                      <span
                        className="mr-1"
                        style={{ color: "var(--primary)" }}
                      >
                        고정
                      </span>
                    )}
                    {post.title}
                  </p>
                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {post.author_name || "익명"} ·{" "}
                    {formatPostedAt(post.created_at)}
                  </p>
                </div>
                {board.has_status && post.status && (
                  <PostStatusBadge status={post.status} className="shrink-0" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BoardPostEditorModal
        open={writing}
        modalTitle={`${board.name} 글쓰기`}
        titleValue={title}
        bodyValue={body}
        saving={saving}
        submitLabel="등록"
        anonymousOption={
          board.allow_anonymous
            ? {
                checked: isAnonymous,
                onChange: setIsAnonymous,
              }
            : undefined
        }
        onClose={() => setWriting(false)}
        onChangeTitle={setTitle}
        onChangeBody={setBody}
        onSubmit={submitPost}
      />
    </div>
  );
}

// 상태 라벨/스타일은 post-status-badge.tsx 로 통합됨.
