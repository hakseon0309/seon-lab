"use client";

import Link from "next/link";
import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import SwapPostTitleCard from "@/components/swap-post-title-card";
import SwapWriteModal from "@/components/swap-write-modal";
import { useToast } from "@/components/toast-provider";
import { usePortalTarget } from "@/lib/client-dom";
import { Board, SwapPost, TeamLite } from "@/lib/types";
import { formatPostedAt } from "@/lib/time";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface Props {
  board: Board;
  initialPosts: SwapPost[];
  myTeams: TeamLite[];
}

export default function SwapBoardView({
  board,
  initialPosts,
  myTeams,
}: Props) {
  const [writing, setWriting] = useState(false);
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
            시프트를 바꾸고 싶은 날짜를 골라 첫 글을 남겨보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {initialPosts.map((post) => {
            const completed = post.swap_status === "done";
            return (
              <li key={post.id}>
                <Link
                  href={completed ? "#" : `/boards/${board.slug}/${post.id}`}
                  aria-disabled={completed}
                  tabIndex={completed ? -1 : 0}
                  onClick={(e) => {
                    if (completed) e.preventDefault();
                  }}
                  className="interactive-press flex flex-col gap-3 rounded-2xl border px-4 py-4"
                  style={{
                    borderColor: "var(--border-light)",
                    backgroundColor: "var(--bg-card)",
                    opacity: completed ? 0.6 : 1,
                    pointerEvents: completed ? "none" : "auto",
                  }}
                >
                  <SwapPostTitleCard post={post} />
                  <div className="flex items-center gap-2">
                    <AvatarImage
                      src={post.team_image_url ?? null}
                      name={post.team_name || "알 수 없는 팀"}
                      sizeClass="h-7 w-7"
                    />
                    <p
                      className="min-w-0 flex-1 truncate text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {(post.team_names?.join(", ") || post.team_name)} ·{" "}
                      {formatPostedAt(post.created_at)}
                    </p>
                    <PostStatusBadge
                      status={post.swap_status}
                      className="shrink-0"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {writing && (
        <SwapWriteModal
          boardSlug={board.slug}
          myTeams={myTeams}
          onClose={() => setWriting(false)}
          onCreated={() => {
            setWriting(false);
            toast.success("글을 등록했습니다");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
