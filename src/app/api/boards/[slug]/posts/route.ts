import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

type CreatePostBody = {
  title?: unknown;
  body?: unknown;
  content?: unknown;
  isAnonymous?: unknown;
  status?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<CreatePostBody>(request);
  if (!parsed.ok) return parsed.response;

  const title = typeof parsed.body.title === "string" ? parsed.body.title.trim() : "";
  const bodyValue = parsed.body.body ?? parsed.body.content;
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
  const isAnonymous = parsed.body.isAnonymous === true;
  const status =
    parsed.body.status === "requested" ||
    parsed.body.status === "accepted" ||
    parsed.body.status === "resolved"
      ? parsed.body.status
      : null;

  if (title.length < 2) return apiErrors.badRequest("제목을 2자 이상 입력해주세요");
  if (body.length < 2) return apiErrors.badRequest("내용을 2자 이상 입력해주세요");
  if (title.length > 120) return apiErrors.badRequest("제목은 120자 이하로 입력해주세요");
  if (body.length > 8000) return apiErrors.badRequest("내용은 8000자 이하로 입력해주세요");

  const { data: board } = await supabase
    .from("boards")
    .select("id, allow_anonymous, has_status, write_role")
    .eq("slug", slug)
    .maybeSingle();

  if (!board) return apiErrors.notFound("게시판을 찾을 수 없습니다");
  if (board.write_role === "admin") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return apiErrors.forbidden("관리자만 글을 작성할 수 있습니다");
    }
  }

  const { data, error } = await supabase
    .from("board_posts")
    .insert({
      board_id: board.id,
      // 익명 글도 author_id 는 기록해 두어 어드민이 "익명 (실명)" 을 확인할 수
      // 있도록 한다. 일반 사용자 응답에서는 서버가 author_id 를 마스킹한다.
      author_id: user.id,
      is_anonymous: isAnonymous,
      title,
      body,
      status: board.has_status ? status ?? "requested" : null,
    })
    .select()
    .single();

  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}`);
  return NextResponse.json(data);
}
