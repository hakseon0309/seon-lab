import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasAppAccess } from "@/lib/access-gate";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { getSeoulDateKey } from "@/lib/time";
import { notifyShiftSwapPostCreated } from "@/lib/push-server";
import { isSameMondayWeek } from "@/lib/swap-board";

export const runtime = "nodejs";

type CreateBody = {
  title?: unknown;
  body?: unknown;
  team_id?: unknown;
  team_ids?: unknown;
  swap_date?: unknown;
};

function isMissingBoardPostTeamsError(error: {
  code?: string | null;
  message?: string | null;
}) {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    (message.includes("board_post_teams") &&
      (message.includes("schema cache") || message.includes("does not exist")))
  );
}

function findStructuredValue(body: string, prefix: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
}

function parseStructuredSwapDate(value: string | undefined) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = value.match(/(\d{2})\.\s*(\d{2})\.\s*(\d{2})/);
  if (!match) return "";

  const [, year, month, day] = match;
  return `20${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, is_admin, access_granted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!hasAppAccess(profile)) {
    return apiErrors.forbidden("초대 코드 확인이 필요합니다");
  }

  const isAdmin = Boolean(profile?.is_admin);

  const parsed = await parseJsonBody<CreateBody>(request);
  if (!parsed.ok) return parsed.response;

  const title =
    typeof parsed.body.title === "string" ? parsed.body.title.trim() : "";
  const body =
    typeof parsed.body.body === "string" ? parsed.body.body.trim() : "";
  const legacyTeamId =
    typeof parsed.body.team_id === "string" ? parsed.body.team_id : "";
  const requestedTeamIds = Array.isArray(parsed.body.team_ids)
    ? parsed.body.team_ids.filter(
        (value): value is string => typeof value === "string"
      )
    : [];
  const teamIds = [
    ...new Set(
      (requestedTeamIds.length > 0 ? requestedTeamIds : [legacyTeamId]).filter(
        Boolean
      )
    ),
  ];
  const team_id = teamIds[0] ?? "";
  const swap_date =
    typeof parsed.body.swap_date === "string" ? parsed.body.swap_date : "";

  if (title.length < 2) return apiErrors.badRequest("제목을 2자 이상 입력해주세요");
  if (body.length < 2) return apiErrors.badRequest("내용을 2자 이상 입력해주세요");
  if (title.length > 120) return apiErrors.badRequest("제목은 120자 이하로 입력해주세요");
  if (body.length > 8000) return apiErrors.badRequest("내용은 8000자 이하로 입력해주세요");
  if (teamIds.length === 0) return apiErrors.badRequest("팀을 하나 이상 선택해주세요");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(swap_date))
    return apiErrors.badRequest("교환할 날짜를 선택해주세요");

  // 과거 날짜 금지 (서울 기준 오늘 이후만)
  const today = getSeoulDateKey(new Date());
  if (swap_date < today)
    return apiErrors.badRequest("오늘 이후 날짜만 선택할 수 있어요");

  if (findStructuredValue(body, "근무 유형:") === "휴무") {
    const myOffDate = parseStructuredSwapDate(
      findStructuredValue(body, "내 휴무 날짜:")
    );

    if (!myOffDate) {
      return apiErrors.badRequest("내 휴무 날짜를 선택해주세요");
    }

    if (myOffDate === swap_date) {
      return apiErrors.badRequest("서로 다른 날짜를 선택해주세요");
    }

    if (!isSameMondayWeek(myOffDate, swap_date)) {
      return apiErrors.badRequest("같은 주차의 날짜만 교환할 수 있어요");
    }
  }

  // 팀 멤버십 검증. 어드민은 모든 팀에 근무 교환 글을 올릴 수 있다.
  if (!isAdmin) {
    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id")
      .in("team_id", teamIds)
      .eq("user_id", user.id);
    const membershipIds = new Set((memberships ?? []).map((row) => row.team_id));
    if (teamIds.some((id) => !membershipIds.has(id))) {
      return apiErrors.forbidden("내가 속한 팀에만 올릴 수 있어요");
    }
  }

  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("slug", "shift-swap")
    .maybeSingle();
  if (!board) return apiErrors.notFound("게시판을 찾을 수 없습니다");

  let createdPostId: string | null = null;

  if (isAdmin) {
    const admin = createAdminClient();
    const { data: validTeams } = await admin
      .from("teams")
      .select("id")
      .in("id", teamIds);
    const validTeamIds = new Set((validTeams ?? []).map((team) => team.id));
    if (teamIds.some((id) => !validTeamIds.has(id))) {
      return apiErrors.badRequest("존재하지 않는 팀이 포함되어 있어요");
    }

    const { data: adminPost, error: adminPostError } = await admin
      .from("board_posts")
      .insert({
        board_id: board.id,
        author_id: user.id,
        is_anonymous: false,
        title,
        body,
        team_id,
        swap_date,
        swap_status: "open",
      })
      .select()
      .single();

    if (adminPostError) return apiError(500, adminPostError.message);

    const { error: targetError } = await admin.from("board_post_teams").insert(
      teamIds.map((id) => ({
        post_id: adminPost.id,
        team_id: id,
      }))
    );

    if (targetError) {
      await admin.from("board_posts").delete().eq("id", adminPost.id);
      if (isMissingBoardPostTeamsError(targetError)) {
        return apiErrors.badRequest(
          "현재 DB에서는 여러 팀 동시 등록을 사용할 수 없어요. 팀을 하나만 선택해주세요"
        );
      }
      return apiError(500, targetError.message);
    }

    createdPostId = adminPost.id;
  } else {
    const { data, error } = await supabase.rpc("create_shift_swap_post", {
      p_title: title,
      p_body: body,
      p_team_ids: teamIds,
      p_swap_date: swap_date,
    });
    createdPostId = typeof data === "string" ? data : null;

    const rpcMissing =
      error &&
      ((typeof error.code === "string" && error.code === "PGRST202") ||
        error.message.includes("create_shift_swap_post"));
    const postTargetTableMissing = error
      ? isMissingBoardPostTeamsError(error)
      : false;

    if (postTargetTableMissing && teamIds.length > 1) {
      return apiErrors.badRequest(
        "현재 DB에서는 여러 팀 동시 등록을 사용할 수 없어요. 팀을 하나만 선택해주세요"
      );
    }

    if (error && !rpcMissing && !postTargetTableMissing) {
      return apiError(500, error.message);
    }

    if (rpcMissing || postTargetTableMissing) {
      const { data: legacyPost, error: legacyError } = await supabase
        .from("board_posts")
        .insert({
          board_id: board.id,
          author_id: user.id,
          is_anonymous: false,
          title,
          body,
          team_id,
          swap_date,
          swap_status: "open",
        })
        .select()
        .single();

      if (legacyError) return apiError(500, legacyError.message);

      if (teamIds.length > 1) {
        const { error: targetError } = await supabase
          .from("board_post_teams")
          .insert(
            teamIds.map((id) => ({
              post_id: legacyPost.id,
              team_id: id,
            }))
          );

        if (targetError) {
          await supabase.from("board_posts").delete().eq("id", legacyPost.id);

          if (isMissingBoardPostTeamsError(targetError)) {
            return apiErrors.badRequest(
              "현재 DB에서는 여러 팀 동시 등록을 사용할 수 없어요. 팀을 하나만 선택해주세요"
            );
          }

          return apiError(500, targetError.message);
        }
      }

      createdPostId = legacyPost.id;
    }
  }

  revalidatePath("/boards/shift-swap");

  if (createdPostId) {
    try {
      await notifyShiftSwapPostCreated({
        postId: createdPostId,
        title,
        authorId: user.id,
        actorName: profile?.display_name || "이름 없음",
        teamIds,
      });
    } catch {
      // Push delivery should never make post creation fail.
    }
  }

  return NextResponse.json({ id: createdPostId });
}
