"use client";

import AvatarImage from "@/components/avatar-image";
import { formatPostedAt } from "@/lib/time";
import { BoardComment } from "@/lib/types";
import type { FormEvent } from "react";

interface Props {
  comments: BoardComment[];
  commentBody: string;
  submitting: boolean;
  canDelete: boolean;
  onChangeCommentBody: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: (commentId: string) => void;
}

export default function PostCommentsSection({
  comments,
  commentBody,
  submitting,
  canDelete,
  onChangeCommentBody,
  onSubmit,
  onDelete,
}: Props) {
  return (
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
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start gap-2 rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <AvatarImage
                src={comment.author_avatar_url ?? null}
                name={comment.author_name || "익명"}
                sizeClass="h-7 w-7"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="truncate text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {comment.author_name || "익명"}
                  </p>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatPostedAt(comment.created_at)}
                  </span>
                </div>
                <p
                  className="mt-1 whitespace-pre-wrap text-sm leading-6"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {comment.body}
                </p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
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

      <form onSubmit={onSubmit} className="mt-4 space-y-2">
        <textarea
          value={commentBody}
          onChange={(event) => onChangeCommentBody(event.target.value)}
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
            disabled={submitting || commentBody.trim().length === 0}
            className="interactive-press rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            {submitting ? "등록 중…" : "댓글 등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
