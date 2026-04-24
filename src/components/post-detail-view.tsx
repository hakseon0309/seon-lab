"use client";

import AvatarImage from "@/components/avatar-image";
import Modal from "@/components/modal";
import PostStatusBadge from "@/components/post-status-badge";
import { useToast } from "@/components/toast-provider";
import { Board, BoardComment, BoardPost } from "@/lib/types";
import { formatPostedAt } from "@/lib/time";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  board: Board;
  initialPost: BoardPost;
  initialComments: BoardComment[];
  postAuthorName: string;
  postAuthorAvatar: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
}

const STATUS_OPTIONS: {
  value: "requested" | "accepted" | "resolved";
  label: string;
}[] = [
  { value: "requested", label: "요청됨" },
  { value: "accepted", label: "접수됨" },
  { value: "resolved", label: "해결됨" },
];

export default function PostDetailView({
  board,
  initialPost,
  initialComments,
  postAuthorName,
  postAuthorAvatar,
  canEdit,
  canDelete,
  canChangeStatus,
}: Props) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState(initialComments);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    setHeaderSlot(document.getElementById("post-header-actions"));
  }, []);

  async function savePost(e: React.FormEvent) {
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
    setPost((prev) => ({ ...prev, title: editTitle, body: editBody }));
    setEditing(false);
    toast.success("글을 수정했습니다");
    router.refresh();
  }

  async function deletePost() {
    if (!confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
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

  async function changeStatus(next: "requested" | "accepted" | "resolved") {
    if (next === post.status) return;
    setSavingStatus(true);
    const res = await fetch(
      `/api/boards/${board.slug}/posts/${post.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setSavingStatus(false);
    if (!res.ok) {
      toast.error(data.error || "상태 변경에 실패했습니다");
      return;
    }
    setPost((prev) => ({ ...prev, status: next }));
    toast.success("상태를 변경했습니다");
    router.refresh();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (body.length < 1) return;
    setSubmittingComment(true);
    const res = await fetch(
      `/api/boards/${board.slug}/posts/${post.id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setSubmittingComment(false);
    if (!res.ok) {
      toast.error(data.error || "댓글 작성에 실패했습니다");
      return;
    }
    setComments((prev) => [...prev, data.comment as BoardComment]);
    setCommentBody("");
    router.refresh();
  }

  async function deleteComment(commentId: string) {
    if (!confirm("댓글을 삭제할까요?")) return;
    const res = await fetch(
      `/api/boards/${board.slug}/posts/${post.id}/comments?id=${commentId}`,
      { method: "DELETE" }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "삭제에 실패했습니다");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success("댓글을 삭제했습니다");
    router.refresh();
  }

  const headerActions = (canEdit || canDelete) && (
    <div className="flex items-center gap-1">
      {canEdit && (
        <button
          type="button"
          onClick={() => {
            setEditTitle(post.title);
            setEditBody(post.body);
            setEditing(true);
          }}
          className="interactive-press rounded-md px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          수정
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={deletePost}
          disabled={deleting}
          className="interactive-press rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50"
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
    <div className="px-4 lg:px-0">
      {headerSlot && headerActions && createPortal(headerActions, headerSlot)}

      {/* 본문 상단 정보 행 — 달력의 "년 월" 헤더처럼 한 줄로 아바타 · 작성자 · 시각 */}
      <div className="mb-4 flex items-center gap-2 pt-2">
        <AvatarImage
          src={postAuthorAvatar}
          name={postAuthorName}
          sizeClass="h-8 w-8"
        />
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {postAuthorName}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          ·
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatPostedAt(post.created_at)}
        </span>
      </div>

      {canChangeStatus && (
        <div className="mb-4">
          <p
            className="mb-2 text-xs font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            상태
          </p>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = post.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => changeStatus(opt.value)}
                  disabled={savingStatus}
                  className="interactive-press flex-1 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{
                    backgroundColor: active
                      ? "var(--primary-light)"
                      : "var(--bg-surface)",
                    color: active ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {board.has_status && !canChangeStatus && post.status && (
        <PostStatusBadge status={post.status} className="mb-4" />
      )}

      <article>
        <p
          className="whitespace-pre-wrap text-sm leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {post.body}
        </p>
      </article>

      {board.allow_comments && (
        <section
          className="mt-8 border-t pt-5"
          style={{ borderColor: "var(--border-light)" }}
        >
          <h2
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            댓글 {comments.length}
          </h2>
          {comments.length === 0 ? (
            <p
              className="py-4 text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              아직 댓글이 없어요
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: "var(--border-light)",
                    backgroundColor: "var(--bg-card)",
                  }}
                >
                  <AvatarImage
                    src={c.author_avatar_url ?? null}
                    name={c.author_name || "익명"}
                    sizeClass="h-7 w-7"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="truncate text-xs font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.author_name || "익명"}
                      </p>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatPostedAt(c.created_at)}
                      </span>
                    </div>
                    <p
                      className="mt-1 whitespace-pre-wrap text-sm leading-6"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.body}
                    </p>
                  </div>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="interactive-press shrink-0 text-xs"
                      style={{ color: "var(--error)" }}
                    >
                      삭제
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={submitComment} className="mt-4 space-y-2">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="댓글을 입력하세요"
              rows={3}
              maxLength={2000}
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
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || commentBody.trim().length === 0}
                className="interactive-press rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                }}
              >
                {submittingComment ? "등록 중…" : "댓글 등록"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editing && (
        <Modal
          title="글 수정"
          onClose={() => setEditing(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={savePost} className="space-y-3">
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
              rows={10}
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

// 상태 라벨/스타일은 post-status-badge.tsx 로 통합됨.
