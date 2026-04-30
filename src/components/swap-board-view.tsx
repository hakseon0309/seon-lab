"use client";

import SwapPostDetailModal from "@/components/swap-post-detail-modal";
import SwapPostTitleCard from "@/components/swap-post-title-card";
import SwapWriteModal from "@/components/swap-write-modal";
import { useToast } from "@/components/toast-provider";
import { usePortalTarget } from "@/lib/client-dom";
import { Board, SwapPost, TeamLite } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface Props {
  board: Board;
  initialPosts: SwapPost[];
  myTeams: TeamLite[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function SwapBoardView({
  board,
  initialPosts,
  myTeams,
  currentUserId,
  isAdmin,
}: Props) {
  const [writing, setWriting] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState<SwapPost | null>(null);
  const router = useRouter();
  const toast = useToast();
  const headerSlot = usePortalTarget("board-header-actions");

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

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

      {posts.length === 0 ? (
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
            근무를 바꾸고 싶은 날짜를 골라 첫 글을 남겨보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const completed = post.swap_status === "done";
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="interactive-press block w-full rounded-lg border px-3 py-3 text-left"
                  style={{
                    borderColor: "var(--border-light)",
                    backgroundColor: "var(--bg-card)",
                    opacity: completed ? 0.72 : 1,
                  }}
                >
                  <SwapPostTitleCard post={post} />
                </button>
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

      {selectedPost && (
        <SwapPostDetailModal
          key={selectedPost.id}
          board={board}
          post={selectedPost}
          currentUserId={currentUserId}
          canDelete={selectedPost.author_id === currentUserId || isAdmin}
          onClose={() => setSelectedPost(null)}
          onPostChanged={(nextPost) => {
            setSelectedPost(nextPost);
            setPosts((prev) =>
              prev.map((post) => (post.id === nextPost.id ? nextPost : post))
            );
            router.refresh();
          }}
          onDeleted={() => {
            setPosts((prev) =>
              prev.filter((post) => post.id !== selectedPost.id)
            );
            setSelectedPost(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
