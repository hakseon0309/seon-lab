import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import PostDetailView from "@/components/post-detail-view";
import ChatPostView from "@/components/chat-post-view";
import BackButton from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import {
  Board,
  BoardComment,
  BoardMessage,
  BoardPost,
  SwapEvent,
} from "@/lib/types";
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
  if (currentBoard.kind === "chat") {
    const { data: postData } = await supabase
      .from("board_posts")
      .select(
        "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at, team_id, swap_date, swap_status, completed_at"
      )
      .eq("id", postId)
      .eq("board_id", currentBoard.id)
      .maybeSingle();
    if (!postData) notFound();
    const chatPost = postData as BoardPost & {
      team_id: string;
      swap_date: string | null;
      swap_status: "open" | "done";
      completed_at: string | null;
    };

    const { data: messageRows } = await supabase
      .from("board_messages")
      .select("id, post_id, author_id, body, created_at")
      .eq("post_id", chatPost.id)
      .order("created_at", { ascending: true });
    const messages = (messageRows as BoardMessage[] | null) ?? [];

    const authorIds = [
      ...new Set(
        [chatPost.author_id, ...messages.map((m) => m.author_id)].filter(
          Boolean
        ) as string[]
      ),
    ];

    const [{ data: profiles }, { data: teamRow }] = await Promise.all([
      authorIds.length > 0
        ? supabase
            .from("user_profiles")
            .select("id, display_name, avatar_url")
            .in("id", authorIds)
        : Promise.resolve({
            data: [] as {
              id: string;
              display_name: string | null;
              avatar_url: string | null;
            }[],
          }),
      supabase.from("teams").select("id, name").eq("id", chatPost.team_id).maybeSingle(),
    ]);

    const profileMap = new Map(
      ((profiles ?? []) as {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      }[]).map((p) => [p.id, p])
    );

    // 작성자의 swap_date 해당 시프트 조회
    let swapEvent: SwapEvent | null = null;
    if (chatPost.author_id && chatPost.swap_date) {
      const startISO = new Date(
        `${chatPost.swap_date}T00:00:00+09:00`
      ).toISOString();
      const endISO = new Date(
        new Date(`${chatPost.swap_date}T00:00:00+09:00`).getTime() +
          24 * 60 * 60 * 1000
      ).toISOString();
      const { data: evs } = await supabase
        .from("events")
        .select("summary, start_at, end_at")
        .eq("user_id", chatPost.author_id)
        .gte("start_at", startISO)
        .lt("start_at", endISO)
        .limit(1);
      swapEvent = (evs?.[0] as SwapEvent | undefined) ?? null;
    }

    const postAuthor = chatPost.author_id
      ? profileMap.get(chatPost.author_id) ?? null
      : null;

    const enrichedMessages = messages.map((m) => {
      const a = profileMap.get(m.author_id);
      return {
        ...m,
        author_name: a?.display_name || "이름 없음",
        author_avatar_url: a?.avatar_url ?? null,
      };
    });

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
            postAuthorName={postAuthor?.display_name || "이름 없음"}
            postAuthorAvatar={postAuthor?.avatar_url ?? null}
            teamName={teamRow?.name || "알 수 없는 팀"}
            swapEvent={swapEvent}
            currentUserId={user.id}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </main>
      </>
    );
  }

  // ============================================================
  // 기존 post 타입
  // ============================================================
  const { data: postData } = await supabase
    .from("board_posts")
    .select(
      "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at"
    )
    .eq("id", postId)
    .eq("board_id", currentBoard.id)
    .maybeSingle();

  if (!postData) notFound();
  const post = postData as BoardPost;

  // 현재 사용자가 해당 게시판 관리자인지(전역 admin 포함)
  let isManager = isAdmin;
  if (!isManager) {
    const { data: mgr } = await supabase
      .from("board_managers")
      .select("user_id")
      .eq("board_id", currentBoard.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isManager = Boolean(mgr);
  }

  const { data: commentData } = await supabase
    .from("board_comments")
    .select("id, post_id, author_id, is_anonymous, body, created_at, updated_at")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  const comments = (commentData as BoardComment[] | null) ?? [];

  // 모든 작성자 아이디 수집 — 익명이어도 admin 에게는 실명을 보여줘야 하므로
  // is_anonymous 와 관계 없이 author_id 를 전부 조회한다.
  const relatedAuthorIds = [
    ...new Set(
      [post.author_id, ...comments.map((c) => c.author_id)].filter(
        Boolean
      ) as string[]
    ),
  ];

  const authorMap = new Map<
    string,
    { display_name: string | null; avatar_url: string | null }
  >();
  if (relatedAuthorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .in("id", relatedAuthorIds);
    for (const p of (profiles ?? []) as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]) {
      authorMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
    }
  }

  // 익명 글/댓글은 일반 사용자에게는 "익명" 으로만 보이고, 어드민에게는
  // "익명 (실명)" 형태로 보인다. 아바타는 익명이면 노출하지 않는다.
  const formatName = (
    isAnonymous: boolean,
    authorId: string | null
  ): string => {
    const real =
      authorId && authorMap.get(authorId)?.display_name
        ? authorMap.get(authorId)!.display_name!
        : "";
    if (isAnonymous) {
      if (isAdmin && real) return `익명 (${real})`;
      return "익명";
    }
    return real || "이름 없음";
  };

  const postAuthorName = formatName(post.is_anonymous, post.author_id);
  const postAuthorAvatar = post.is_anonymous
    ? null
    : (post.author_id && authorMap.get(post.author_id)?.avatar_url) || null;

  const enrichedComments = comments.map((c) => ({
    ...c,
    author_name: formatName(c.is_anonymous, c.author_id),
    author_avatar_url: c.is_anonymous
      ? null
      : (c.author_id && authorMap.get(c.author_id)?.avatar_url) || null,
  }));

  const canEdit = post.author_id === user.id;
  const canDelete = canEdit || isAdmin;
  const canChangeStatus = isManager && currentBoard.has_status;

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
