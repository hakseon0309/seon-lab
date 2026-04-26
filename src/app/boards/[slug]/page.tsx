import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import BoardView from "@/components/board-view";
import BoardManageButton from "@/components/board-manage-button";
import SwapBoardView from "@/components/swap-board-view";
import { isShiftSwapBoard } from "@/lib/boards";
import { loadBoardPostsData } from "@/lib/board-server";
import { loadShiftSwapBoardData } from "@/lib/shift-swap-server";
import { createClient } from "@/lib/supabase/server";
import { Board } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

type BoardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;
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
  // 시프트 교환 (chat 타입) 전용 경로
  // ============================================================
  if (isShiftSwapBoard(currentBoard)) {
    const { myTeams, swapPosts } = await loadShiftSwapBoardData({
      supabase,
      boardId: currentBoard.id,
      userId: user.id,
    });

    return (
      <>
        <RouteTransitionDone />
        <Nav />
        <PageHeader maxWidth="max-w-lg">
          <div className="flex w-full items-center gap-3">
            <h1
              className="min-w-0 flex-1 text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {currentBoard.name}
            </h1>
            <BoardHeaderActionsSlot />
          </div>
        </PageHeader>
        <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
          <SwapBoardView
            board={currentBoard}
            initialPosts={swapPosts}
            myTeams={myTeams}
          />
        </main>
      </>
    );
  }

  if (currentBoard.kind === "chat") {
    notFound();
  }

  const postsWithAuthors = await loadBoardPostsData({
    supabase,
    boardId: currentBoard.id,
    isAdmin,
  });

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <div className="flex w-full items-center gap-3">
          <h1
            className="min-w-0 flex-1 text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {currentBoard.name}
          </h1>
          <BoardHeaderActionsSlot />
          {isAdmin && <BoardManageButton boardId={currentBoard.id} />}
        </div>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
        <BoardView board={currentBoard} initialPosts={postsWithAuthors} />
      </main>
    </>
  );
}

function BoardHeaderActionsSlot() {
  return <div id="board-header-actions" className="ml-auto shrink-0" />;
}
