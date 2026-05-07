"use client";

import Modal from "@/components/modal";
import PageFooter from "@/components/page-footer";
import SwapPostTitleCard from "@/components/swap-post-title-card";
import { useToast } from "@/components/toast-provider";
import { usePortalTarget } from "@/lib/client-dom";
import { Board, SwapPost, TeamLite } from "@/lib/types";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SwapWriteModal = dynamic(() => import("@/components/swap-write-modal"));
const SwapPostDetailModal = dynamic(
  () => import("@/components/swap-post-detail-modal")
);

function prewarmSwapWriteModal() {
  void import("@/components/swap-write-modal");
}

function prewarmSwapPostDetailModal() {
  void import("@/components/swap-post-detail-modal");
}

interface Props {
  board: Board;
  initialPosts: SwapPost[];
  myTeams: TeamLite[];
  currentUserId: string;
  isAdmin: boolean;
}

function getSwapPostCardStyle(completed: boolean) {
  return {
    borderColor: "var(--border-light)",
    backgroundColor: "var(--bg-card)",
    opacity: completed ? 0.72 : 1,
  };
}

type SwapPostFilter = "all" | "available";

export default function SwapBoardView({
  board,
  initialPosts,
  myTeams,
  currentUserId,
  isAdmin,
}: Props) {
  const [writing, setWriting] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [filter, setFilter] = useState<SwapPostFilter>("all");
  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState<SwapPost | null>(null);
  const router = useRouter();
  const toast = useToast();
  const headerSlot = usePortalTarget("board-header-actions");

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const visiblePosts =
    filter === "available"
      ? posts.filter((post) => post.swap_match_tone === "match")
      : posts;

  const filterButton = (
    <button
      type="button"
      onClick={() => setFiltering(true)}
      className="interactive-press h-8 min-w-12 shrink-0 rounded-md px-2.5 text-xs font-semibold"
      style={{
        backgroundColor:
          filter === "available" ? "var(--primary)" : "var(--button-surface)",
        color:
          filter === "available"
            ? "var(--text-on-primary)"
            : "var(--text-primary)",
      }}
    >
      필터
    </button>
  );

  return (
    <>
      <div className="px-4 lg:px-0">
        {headerSlot ? createPortal(filterButton, headerSlot) : null}

        {visiblePosts.length === 0 ? (
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
              {posts.length === 0
                ? "아직 등록된 글이 없어요"
                : "조건에 맞는 글이 없어요"}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {posts.length === 0
                ? "근무를 바꾸고 싶은 날짜를 골라 첫 글을 남겨보세요."
                : "다른 보기 조건을 선택해보세요."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visiblePosts.map((post) => {
              const completed = post.swap_status === "done";
              return (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => {
                      prewarmSwapPostDetailModal();
                      setSelectedPost(post);
                    }}
                    onFocus={prewarmSwapPostDetailModal}
                    onPointerEnter={prewarmSwapPostDetailModal}
                    className="interactive-press block w-full rounded-lg border px-3 py-3 text-left"
                    style={getSwapPostCardStyle(completed)}
                  >
                    <SwapPostTitleCard post={post} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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

      {filtering && (
        <Modal
          title="글 보기"
          onClose={() => setFiltering(false)}
          maxWidth="max-w-sm"
        >
          <div className="space-y-2">
            <FilterOptionButton
              active={filter === "all"}
              onClick={() => {
                setFilter("all");
                setFiltering(false);
              }}
            >
              모든 글 보기
            </FilterOptionButton>
            <FilterOptionButton
              active={filter === "available"}
              onClick={() => {
                setFilter("available");
                setFiltering(false);
              }}
            >
              내가 교환해줄 수 있는 글만 보기
            </FilterOptionButton>
          </div>
        </Modal>
      )}

      <PageFooter maxWidth="max-w-lg">
        <div className="flex w-full justify-center">
          <button
            type="button"
            onClick={() => {
              prewarmSwapWriteModal();
              setWriting(true);
            }}
            onFocus={prewarmSwapWriteModal}
            onPointerEnter={prewarmSwapWriteModal}
            className="interactive-press w-[calc((100%-1rem)/2)] rounded-full py-3.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            글 작성하기
          </button>
        </div>
      </PageFooter>
    </>
  );
}

function FilterOptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="interactive-press flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-semibold"
      style={{
        borderColor: active ? "var(--primary)" : "var(--border-light)",
        backgroundColor: active ? "var(--primary-light)" : "var(--bg-card)",
        color: "var(--text-primary)",
      }}
    >
      <span>{children}</span>
      {active && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          선택됨
        </span>
      )}
    </button>
  );
}
