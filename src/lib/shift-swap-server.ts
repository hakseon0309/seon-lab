import { buildAuthorMap, collectAuthorIds } from "@/lib/board-authors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isExpiredShiftSwapPost } from "@/lib/shift-swap-retention";
import {
  getSeoulDateKey,
  getSeoulIsoDayRange,
  getSeoulIsoInclusiveDateRange,
} from "@/lib/time";
import {
  BoardMessage,
  BoardPost,
  SwapEvent,
  SwapPost,
  TeamLite,
} from "@/lib/types";
import { getSwapPostMatchTone } from "@/lib/swap-board";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

type TeamJoinValue =
  | { id: string; name: string; image_url?: string | null }
  | { id: string; name: string; image_url?: string | null }[]
  | null;

type ShiftSwapPostRow = BoardPost & {
  team_id: string;
  swap_date: string | null;
  swap_status: "open" | "done";
  completed_at: string | null;
};

type BoardPostTeamRow = {
  post_id: string;
  team_id: string;
  teams: TeamJoinValue;
};

interface ShiftSwapTeamTargets {
  ids: string[];
  names: string[];
  imageUrls: (string | null)[];
}

interface ShiftSwapPostDetailData {
  chatPost: ShiftSwapPostRow;
  enrichedMessages: BoardMessage[];
  postAuthorName: string;
  postAuthorAvatar: string | null;
  teamNames: string[];
  swapEvent: SwapEvent | null;
}

interface ShiftSwapBoardData {
  myTeams: TeamLite[];
  swapPosts: SwapPost[];
}

interface CurrentUserSwapAvailability {
  hasCalendarData: boolean;
  eventsByDate: Map<string, SwapEvent>;
}

function pickJoinedTeam(team: TeamJoinValue) {
  return Array.isArray(team) ? team[0] ?? null : team;
}

async function loadMyTeams(
  supabase: ServerSupabase,
  userId: string,
  isAdmin: boolean
) {
  if (isAdmin) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");

    return ((teams ?? []) as TeamLite[]).filter(Boolean);
  }

  const { data: teamRows } = await supabase
    .from("team_members")
    .select("team_id, teams(id, name)")
    .eq("user_id", userId);

  return ((teamRows ?? []) as {
    teams: { id: string; name: string } | { id: string; name: string }[] | null;
  }[])
    .map((row) => {
      const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
      return team ? { id: team.id, name: team.name } : null;
    })
    .filter((team): team is TeamLite => Boolean(team));
}

async function loadAuthorProfileMap(
  supabase: ServerSupabase,
  authorIds: string[]
) {
  if (authorIds.length === 0) {
    return buildAuthorMap([]);
  }

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url")
    .in("id", authorIds);

  return buildAuthorMap(
    (profiles ?? []) as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]
  );
}

async function loadTeamTargetsByPost(
  supabase: ServerSupabase,
  postIds: string[],
  teamIds: string[]
) {
  const [{ data: teams }, targetRes] = await Promise.all([
    teamIds.length > 0
      ? supabase.from("teams").select("id, name, image_url").in("id", teamIds)
      : Promise.resolve({
          data: [] as { id: string; name: string; image_url: string | null }[],
        }),
    postIds.length > 0
      ? supabase
          .from("board_post_teams")
          .select("post_id, team_id, teams(id, name, image_url)")
          .in("post_id", postIds)
      : Promise.resolve({
          data: [] as BoardPostTeamRow[],
          error: null,
        }),
  ]);

  const teamMap = new Map(
    ((teams ?? []) as {
      id: string;
      name: string;
      image_url: string | null;
    }[]).map((team) => [team.id, team])
  );
  const targetsByPost = new Map<string, ShiftSwapTeamTargets>();

  if (!targetRes.error) {
    for (const row of (targetRes.data ?? []) as BoardPostTeamRow[]) {
      const joinedTeam = pickJoinedTeam(row.teams);
      const current = targetsByPost.get(row.post_id) ?? {
        ids: [],
        names: [],
        imageUrls: [],
      };

      if (!current.ids.includes(row.team_id)) {
        current.ids.push(row.team_id);
        current.names.push(
          joinedTeam?.name || teamMap.get(row.team_id)?.name || "알 수 없는 팀"
        );
        current.imageUrls.push(
          joinedTeam?.image_url ?? teamMap.get(row.team_id)?.image_url ?? null
        );
      }

      targetsByPost.set(row.post_id, current);
    }
  }

  return { teamMap, targetsByPost };
}

async function loadSwapEventMapForPosts(
  supabase: ServerSupabase,
  posts: ShiftSwapPostRow[]
) {
  const eventPairs = posts
    .filter((post) => post.swap_date && post.author_id)
    .map((post) => ({ userId: post.author_id!, date: post.swap_date! }));
  const eventMap = new Map<string, SwapEvent>();

  if (eventPairs.length === 0) {
    return eventMap;
  }

  const minDate = eventPairs.reduce(
    (min, pair) => (pair.date < min ? pair.date : min),
    eventPairs[0].date
  );
  const maxDate = eventPairs.reduce(
    (max, pair) => (pair.date > max ? pair.date : max),
    eventPairs[0].date
  );
  const { startISO, endISO } = getSeoulIsoInclusiveDateRange(minDate, maxDate);
  const userIds = [...new Set(eventPairs.map((pair) => pair.userId))];

  const { data: events } = await supabase
    .from("events")
    .select("user_id, summary, start_at, end_at")
    .in("user_id", userIds)
    .gte("start_at", startISO)
    .lt("start_at", endISO);

  for (const event of ((events ?? []) as {
    user_id: string;
    summary: string;
    start_at: string;
    end_at: string;
  }[])) {
    const seoulDate = getSeoulDateKey(event.start_at);
    const key = `${event.user_id}|${seoulDate}`;
    if (!eventMap.has(key)) {
      eventMap.set(key, {
        summary: event.summary,
        start_at: event.start_at,
        end_at: event.end_at,
      });
    }
  }

  return eventMap;
}

async function loadSwapEventForPost(
  supabase: ServerSupabase,
  chatPost: ShiftSwapPostRow
) {
  if (!chatPost.author_id || !chatPost.swap_date) {
    return null;
  }

  const { startISO, endISO } = getSeoulIsoDayRange(chatPost.swap_date);
  const { data: events } = await supabase
    .from("events")
    .select("summary, start_at, end_at")
    .eq("user_id", chatPost.author_id)
    .gte("start_at", startISO)
    .lt("start_at", endISO)
    .limit(1);

  return (events?.[0] as SwapEvent | undefined) ?? null;
}

async function loadCurrentUserSwapAvailability(
  supabase: ServerSupabase,
  userId: string,
  dates: string[]
): Promise<CurrentUserSwapAvailability> {
  const empty = {
    hasCalendarData: false,
    eventsByDate: new Map<string, SwapEvent>(),
  };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("ics_url")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.ics_url) return empty;

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!count) return empty;

  const uniqueDates = [...new Set(dates.filter(Boolean))];
  if (uniqueDates.length === 0) {
    return {
      hasCalendarData: true,
      eventsByDate: new Map<string, SwapEvent>(),
    };
  }

  const minDate = uniqueDates.reduce(
    (min, date) => (date < min ? date : min),
    uniqueDates[0]
  );
  const maxDate = uniqueDates.reduce(
    (max, date) => (date > max ? date : max),
    uniqueDates[0]
  );
  const { startISO, endISO } = getSeoulIsoInclusiveDateRange(minDate, maxDate);
  const { data: events } = await supabase
    .from("events")
    .select("summary, start_at, end_at")
    .eq("user_id", userId)
    .gte("start_at", startISO)
    .lt("start_at", endISO);

  const eventsByDate = new Map<string, SwapEvent>();
  for (const event of ((events ?? []) as SwapEvent[])) {
    const date = getSeoulDateKey(event.start_at);
    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, event);
    }
  }

  return {
    hasCalendarData: true,
    eventsByDate,
  };
}

export async function loadShiftSwapBoardData(params: {
  supabase: ServerSupabase;
  boardId: string;
  userId: string;
  isAdmin: boolean;
}): Promise<ShiftSwapBoardData> {
  const { supabase, boardId, userId, isAdmin } = params;
  const dataClient = isAdmin ? createAdminClient() : supabase;
  const [myTeams, postRes] = await Promise.all([
    loadMyTeams(dataClient, userId, isAdmin),
    dataClient
      .from("board_posts")
      .select(
        "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at, team_id, swap_date, swap_status, completed_at"
      )
      .eq("board_id", boardId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const posts = ((postRes.data as ShiftSwapPostRow[] | null) ?? [])
    .filter((post) => !isExpiredShiftSwapPost(post))
    .slice(0, 100);
  const authorIds = collectAuthorIds(posts);
  const teamIds = [...new Set(posts.map((post) => post.team_id))];
  const postIds = posts.map((post) => post.id);
  const swapDates = posts
    .map((post) => post.swap_date)
    .filter((date): date is string => Boolean(date));

  const [
    profileMap,
    { teamMap, targetsByPost },
    eventMap,
    currentUserAvailability,
  ] = await Promise.all([
    loadAuthorProfileMap(dataClient, authorIds),
    loadTeamTargetsByPost(dataClient, postIds, teamIds),
    loadSwapEventMapForPosts(dataClient, posts),
    loadCurrentUserSwapAvailability(dataClient, userId, swapDates),
  ]);

  const swapPosts: SwapPost[] = posts.map((post) => {
    const author = post.author_id ? profileMap.get(post.author_id) : null;
    const eventKey =
      post.author_id && post.swap_date ? `${post.author_id}|${post.swap_date}` : "";
    const targetTeams = targetsByPost.get(post.id);
    const teamNames = targetTeams?.names.length
      ? targetTeams.names
      : [teamMap.get(post.team_id)?.name || "알 수 없는 팀"];
    const teamImageUrls = targetTeams?.imageUrls.length
      ? targetTeams.imageUrls
      : [teamMap.get(post.team_id)?.image_url ?? null];

    return {
      ...post,
      author_name: author?.display_name || "이름 없음",
      author_avatar_url: author?.avatar_url ?? null,
      team_name: teamNames[0],
      team_image_url: teamImageUrls[0],
      team_ids: targetTeams?.ids ?? [post.team_id],
      team_names: teamNames,
      team_image_urls: teamImageUrls,
      swap_status: post.swap_status || "open",
      swap_event: eventKey ? eventMap.get(eventKey) ?? null : null,
      swap_match_tone: getSwapPostMatchTone({
        post,
        currentUserId: userId,
        hasCalendarData: currentUserAvailability.hasCalendarData,
        myEventsByDate: currentUserAvailability.eventsByDate,
      }),
    };
  });

  return { myTeams, swapPosts };
}

export async function loadShiftSwapPostDetailData(params: {
  supabase: ServerSupabase;
  boardId: string;
  postId: string;
  isAdmin?: boolean;
}): Promise<ShiftSwapPostDetailData | null> {
  const { supabase, boardId, postId, isAdmin = false } = params;
  const dataClient = isAdmin ? createAdminClient() : supabase;
  const { data: postData } = await dataClient
    .from("board_posts")
    .select(
      "id, board_id, author_id, is_anonymous, title, body, is_pinned, status, created_at, updated_at, team_id, swap_date, swap_status, completed_at"
    )
    .eq("id", postId)
    .eq("board_id", boardId)
    .maybeSingle();

  if (!postData) {
    return null;
  }

  const chatPost = postData as ShiftSwapPostRow;
  if (isExpiredShiftSwapPost(chatPost)) {
    return null;
  }

  const { data: messageRows } = await dataClient
    .from("board_messages")
    .select("id, post_id, author_id, body, created_at")
    .eq("post_id", chatPost.id)
    .order("created_at", { ascending: true });
  const messages = (messageRows as BoardMessage[] | null) ?? [];
  const authorIds = collectAuthorIds([{ author_id: chatPost.author_id }, ...messages]);

  const [profileMap, swapEvent, targetData] = await Promise.all([
    loadAuthorProfileMap(dataClient, authorIds),
    loadSwapEventForPost(dataClient, chatPost),
    loadTeamTargetsByPost(dataClient, [chatPost.id], [chatPost.team_id]),
  ]);

  const postAuthor = chatPost.author_id
    ? profileMap.get(chatPost.author_id) ?? null
    : null;
  const targetTeams = targetData.targetsByPost.get(chatPost.id);
  const teamNames = targetTeams?.names.length
    ? targetTeams.names
    : [targetData.teamMap.get(chatPost.team_id)?.name || "알 수 없는 팀"];
  const enrichedMessages = messages.map((message) => {
    const author = profileMap.get(message.author_id);
    return {
      ...message,
      author_name: author?.display_name || "이름 없음",
      author_avatar_url: author?.avatar_url ?? null,
    };
  });

  return {
    chatPost,
    enrichedMessages,
    postAuthorName: postAuthor?.display_name || "이름 없음",
    postAuthorAvatar: postAuthor?.avatar_url ?? null,
    teamNames,
    swapEvent,
  };
}
