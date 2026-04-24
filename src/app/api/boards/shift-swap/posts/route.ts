import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { getSeoulDateKey } from "@/lib/time";

type CreateBody = {
  title?: unknown;
  body?: unknown;
  team_id?: unknown;
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
  const team_id = typeof parsed.body.team_id === "string" ? parsed.body.team_id : "";
  const swap_date = typeof parsed.body.swap_date === "string" ? parsed.body.swap_date : "";

  if (title.length < 2) return apiErrors.badRequest("제목을 2자 이상 입력해주세요");
  if (body.length < 2) return apiErrors.badRequest("내용을 2자 이상 입력해주세요");
  if (title.length > 120) return apiErrors.badRequest("제목은 120자 이하로 입력해주세요");
  if (body.length > 8000) return apiErrors.badRequest("내용은 8000자 이하로 입력해주세요");
  if (!team_id) return apiErrors.badRequest("팀을 선택해주세요");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(swap_date))
    return apiErrors.badRequest("교환할 날짜를 선택해주세요");

  // 과거 날짜 금지 (서울 기준 오늘 이후만)
  const today = getSeoulDateKey(new Date());
  if (swap_date < today)
    return apiErrors.badRequest("오늘 이후 날짜만 선택할 수 있어요");

  // 팀 멤버십 검증
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("team_id", team_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return apiErrors.forbidden("내가 속한 팀에만 올릴 수 있어요");

  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("slug", "shift-swap")
    .maybeSingle();
  if (!board) return apiErrors.notFound("게시판을 찾을 수 없습니다");

  const { data, error } = await supabase
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

  if (error) return apiError(500, error.message);

  revalidatePath("/boards/shift-swap");
  return NextResponse.json(data);
}
