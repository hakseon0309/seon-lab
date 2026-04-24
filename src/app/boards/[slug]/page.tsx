import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import BoardView from "@/components/board-view";
import BoardManageButton from "@/components/board-manage-button";
import SwapBoardView from "@/components/swap-board-view";
import { createClient } from "@/lib/supabase/server";
import { Board, BoardPost, SwapPost, TeamLite } from "@/lib/types";
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
  if (currentBoard.kind === "chat" && currentBoard.slug === "shift-swap") {
    // 글쓰기 모달에서 즉시 팀 선택이 가능하도록 SSR 단계에서 내 팀 목록 조회.
    const { data: myTeamRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name)")
      .eq("user_id", user.id);
    const myTeams: TeamLite[] = ((myTeamRows ?? []) as {
      teams: { id: string; name: string } | { id: string; name: string }[] | null;
    }[])
      .map((r) => {
        const t = Array.isArray(r.teams) ? r.teams[0] : r.teams;
        return t ? { id: t.id, name: t.name } : null;
      })
      .filter((t): t is TeamLite => Boolean(t));

    const { data: postData } = await supabase
      .from("board_posts")
      .select(
        "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at, team_id, swap_date, swap_status, completed_at"
      )
      .eq("board_id", currentBoard.id)
      .order("swap_status", { ascending: true }) // open 이 done 보다 앞 (알파벳 순)
      .order("created_at", { ascending: false })
      .limit(100);

    const posts = (postData as (BoardPost & {
      team_id: string;
      swap_date: string | null;
      swap_status: "open" | "done";
      completed_at: string | null;
    })[] | null) ?? [];

    const authorIds = [
      ...new Set(posts.map((p) => p.author_id).filter(Boolean) as string[]),
    ];
    const teamIds = [...new Set(posts.map((p) => p.team_id))];

    const [{ data: profiles }, { data: teams }] = await Promise.all([
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
      teamIds.length > 0
        ? supabase.from("teams").select("id, name").in("id", teamIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);

    const profileMap = new Map(
      ((profiles ?? []) as {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      }[]).map((p) => [p.id, p])
    );
    const teamMap = new Map(
      ((teams ?? []) as { id: string; name: string }[]).map((t) => [t.id, t.name])
    );

    // 각 글의 swap_date 에 해당하는 작성자 시프트를 조회
    const eventPairs = posts
      .filter((p) => p.swap_date && p.author_id)
      .map((p) => ({ userId: p.author_id!, date: p.swap_date! }));

    const eventMap = new Map<
      string, // `${userId}|${date}`
      { summary: string; start_at: string; end_at: string }
    >();

    if (eventPairs.length > 0) {
      // 서울 기준 해당 날짜 범위를 모두 합쳐 한 번의 쿼리로 당김
      const minDate = eventPairs.reduce(
        (min, p) => (p.date < min ? p.date : min),
        eventPairs[0].date
      );
      const maxDate = eventPairs.reduce(
        (max, p) => (p.date > max ? p.date : max),
        eventPairs[0].date
      );
      const startISO = new Date(`${minDate}T00:00:00+09:00`).toISOString();
      const endISO = new Date(
        new Date(`${maxDate}T00:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000
      ).toISOString();

      const userIds = [...new Set(eventPairs.map((p) => p.userId))];
      const { data: events } = await supabase
        .from("events")
        .select("user_id, summary, start_at, end_at")
        .in("user_id", userIds)
        .gte("start_at", startISO)
        .lt("start_at", endISO);

      for (const ev of ((events ?? []) as {
        user_id: string;
        summary: string;
        start_at: string;
        end_at: string;
      }[])) {
        const seoulDate = new Date(ev.start_at).toLocaleDateString("en-CA", {
          timeZone: "Asia/Seoul",
        });
        const key = `${ev.user_id}|${seoulDate}`;
        if (!eventMap.has(key)) {
          eventMap.set(key, {
            summary: ev.summary,
            start_at: ev.start_at,
            end_at: ev.end_at,
          });
        }
      }
    }

    const swapPosts: SwapPost[] = posts.map((p) => {
      const author = p.author_id ? profileMap.get(p.author_id) : null;
      const eventKey = p.author_id && p.swap_date ? `${p.author_id}|${p.swap_date}` : "";
      return {
        ...p,
        author_name: author?.display_name || "이름 없음",
        author_avatar_url: author?.avatar_url ?? null,
        team_id: p.team_id,
        team_name: teamMap.get(p.team_id) || "알 수 없는 팀",
        swap_date: p.swap_date,
        swap_status: p.swap_status || "open",
        completed_at: p.completed_at,
        swap_event: eventKey ? eventMap.get(eventKey) ?? null : null,
      };
    });

    return (
      <>
        <RouteTransitionDone />
        <Nav />
        <PageHeader maxWidth="max-w-lg">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {currentBoard.name}
          </h1>
        </PageHeader>
        <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
          <SwapBoardView
            board={currentBoard}
            initialPosts={swapPosts}
            currentUserId={user.id}
            myTeams={myTeams}
          />
        </main>
      </>
    );
  }

  // ============================================================
  // 기존 post 타입 게시판 (공지/패치노트/피드백)
  // ============================================================
  const { data: postData } = await supabase
    .from("board_posts")
    .select(
      "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at"
    )
    .eq("board_id", currentBoard.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (postData as BoardPost[] | null) ?? [];
  const authorIds = [
    ...new Set(posts.map((post) => post.author_id).filter(Boolean)),
  ] as string[];
  const authorMap = new Map<
    string,
    { display_name: string | null; avatar_url: string | null }
  >();

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);

    for (const profile of (profiles ?? []) as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]) {
      authorMap.set(profile.id, {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      });
    }
  }

  const postsWithAuthors = posts.map((post) => {
    const author = post.author_id ? authorMap.get(post.author_id) : null;
    const real = author?.display_name || "";
    let author_name: string;
    if (post.is_anonymous) {
      author_name = isAdmin && real ? `익명 (${real})` : "익명";
    } else {
      author_name = real || "이름 없음";
    }
    return {
      ...post,
      author_name,
      author_avatar_url: post.is_anonymous ? null : author?.avatar_url ?? null,
    };
  });

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {currentBoard.name}
        </h1>
        {isAdmin && <BoardManageButton boardId={currentBoard.id} />}
      </PageHeader>
      <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
        <BoardView board={currentBoard} initialPosts={postsWithAuthors} />
      </main>
    </>
  );
}
