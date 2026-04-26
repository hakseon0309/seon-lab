import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import PostDetailView from "@/components/post-detail-view";
import ChatPostView from "@/components/chat-post-view";
import BackButton from "@/components/back-button";
import { isShiftSwapBoard } from "@/lib/boards";
import { loadBoardPostDetailData } from "@/lib/board-server";
import { loadShiftSwapPostDetailData } from "@/lib/shift-swap-server";
import { createClient } from "@/lib/supabase/server";
import { Board } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

type PostPageProps = {
  params: Promise<{ slug: string; postId: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug, postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: board }, { data: myProfile }] = await Promise.all([
    supabase.from("boards").select("*").eq("slug", slug).maybeSingle(),
    supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  if (!board) notFound();

  const currentBoard = board as Board;
  const isAdmin = Boolean(myProfile?.is_admin);

  // ============================================================
  // 시프트 교환 (chat) 전용 경로
  // ============================================================
  if (isShiftSwapBoard(currentBoard)) {
    const detail = await loadShiftSwapPostDetailData({
      supabase,
      boardId: currentBoard.id,
      postId,
    });
    if (!detail) notFound();
    const {
      chatPost,
      enrichedMessages,
      postAuthorName,
      postAuthorAvatar,
      teamNames,
      swapEvent,
    } = detail;

    const canEdit = chatPost.author_id === user.id;
    const canDelete = canEdit || isAdmin;

    return (
      <>
        <RouteTransitionDone />
        <Nav />
        <PageHeader maxWidth="max-w-lg">
          <div className="flex w-full items-center gap-3">
            <BackButton href={`/boards/${currentBoard.slug}`} label="게시판으로" />
            <h1
              className="min-w-0 flex-1 truncate text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {chatPost.title}
            </h1>
            {(canEdit || canDelete) && <PostHeaderActionsSlot />}
          </div>
        </PageHeader>
        <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
          <ChatPostView
            board={currentBoard}
            initialPost={chatPost}
            initialMessages={enrichedMessages}
            postAuthorName={postAuthorName}
            postAuthorAvatar={postAuthorAvatar}
            teamName={teamNames.join(", ")}
            swapEvent={swapEvent}
            currentUserId={user.id}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </main>
      </>
    );
  }

  if (currentBoard.kind === "chat") {
    notFound();
  }

  const detail = await loadBoardPostDetailData({
    supabase,
    boardId: currentBoard.id,
    postId,
    viewerUserId: user.id,
    isAdmin,
    hasStatus: currentBoard.has_status,
  });
  if (!detail) notFound();
  const {
    post,
    enrichedComments,
    postAuthorName,
    postAuthorAvatar,
    canEdit,
    canDelete,
    canChangeStatus,
  } = detail;

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <div className="flex w-full items-center gap-3">
          <BackButton href={`/boards/${currentBoard.slug}`} label="게시판으로" />
          <h1
            className="min-w-0 flex-1 truncate text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h1>
          {(canEdit || canDelete) && (
            <PostHeaderActionsSlot />
          )}
        </div>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
        <PostDetailView
          board={currentBoard}
          initialPost={post}
          initialComments={enrichedComments}
          postAuthorName={postAuthorName}
          postAuthorAvatar={postAuthorAvatar}
          canEdit={canEdit}
          canDelete={canDelete}
          canChangeStatus={canChangeStatus}
        />
      </main>
    </>
  );
}

// 공통 헤더 우측 액션 자리. 실제 버튼(수정/삭제)은 client component 인
// PostDetailView 가 portal 로 렌더하므로 여기서는 anchor DOM 만 제공한다.
function PostHeaderActionsSlot() {
  return <div id="post-header-actions" className="ml-auto shrink-0" />;
}
