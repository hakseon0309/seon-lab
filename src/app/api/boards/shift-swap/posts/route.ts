import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { getSeoulDateKey } from "@/lib/time";

type CreateBody = {
  title?: unknown;
  body?: unknown;
  team_id?: unknown;
  team_ids?: unknown;
  swap_date?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<CreateBody>(request);
  if (!parsed.ok) return parsed.response;

  const title = typeof parsed.body.title === "string" ? parsed.body.title.trim() : "";
  const body = typeof parsed.body.body === "string" ? parsed.body.body.trim() : "";
  const legacyTeamId = typeof parsed.body.team_id === "string" ? parsed.body.team_id : "";
  const requestedTeamIds = Array.isArray(parsed.body.team_ids)
    ? parsed.body.team_ids.filter((value): value is string => typeof value === "string")
    : [];
  const teamIds = [...new Set((requestedTeamIds.length > 0 ? requestedTeamIds : [legacyTeamId]).filter(Boolean))];
  const team_id = teamIds[0] ?? "";
  const swap_date = typeof parsed.body.swap_date === "string" ? parsed.body.swap_date : "";

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

  // 팀 멤버십 검증
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .in("team_id", teamIds)
    .eq("user_id", user.id)
  const membershipIds = new Set((memberships ?? []).map((row) => row.team_id));
  if (teamIds.some((id) => !membershipIds.has(id))) {
    return apiErrors.forbidden("내가 속한 팀에만 올릴 수 있어요");
  }

  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("slug", "shift-swap")
    .maybeSingle();
  if (!board) return apiErrors.notFound("게시판을 찾을 수 없습니다");

  const { data, error } = await supabase.rpc("create_shift_swap_post", {
    p_title: title,
    p_body: body,
    p_team_ids: teamIds,
    p_swap_date: swap_date,
  });
  let createdPostId: string | null = typeof data === "string" ? data : null;

  const rpcMissing =
    error &&
    ((typeof error.code === "string" && error.code === "PGRST202") ||
      error.message.includes("create_shift_swap_post"));

  if (error && !rpcMissing) {
    return apiError(500, error.message);
  }

  if (rpcMissing) {
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

    const { error: targetError } = await supabase.from("board_post_teams").insert(
      teamIds.map((id) => ({
        post_id: legacyPost.id,
        team_id: id,
      }))
    );

    if (targetError) {
      await supabase.from("board_posts").delete().eq("id", legacyPost.id);
      return apiError(500, targetError.message);
    }

    createdPostId = legacyPost.id;
  }

  revalidatePath("/boards/shift-swap");
  return NextResponse.json({ id: createdPostId });
}
