"use client";

import Link from "next/link";
import Modal from "@/components/modal";
import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import { Board, BoardPost } from "@/lib/types";
import { formatPostedAt } from "@/lib/time";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast-provider";

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

  async function submitPost(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/boards/${board.slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, isAnonymous }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error || "글 작성에 실패했습니다");
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
      <div className="mb-4 flex justify-end">
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
      </div>

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

      {writing && (
        <Modal
          title={`${board.name} 글쓰기`}
          onClose={() => setWriting(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={submitPost} className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목"
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
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="내용"
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
            {board.allow_anonymous && (
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                />
                익명으로 작성
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="interactive-press w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-on-primary)",
              }}
            >
              {saving ? "등록 중..." : "등록"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// 상태 라벨/스타일은 post-status-badge.tsx 로 통합됨.
