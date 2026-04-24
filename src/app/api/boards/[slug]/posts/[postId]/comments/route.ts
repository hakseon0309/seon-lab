import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

type CreateCommentBody = { body?: unknown };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<CreateCommentBody>(request);
  if (!parsed.ok) return parsed.response;

  const body = typeof parsed.body.body === "string" ? parsed.body.body.trim() : "";
  if (body.length < 1) return apiErrors.badRequest("내용을 입력해주세요");
  if (body.length > 2000) return apiErrors.badRequest("댓글은 2000자 이하로 입력해주세요");

  // 댓글은 언제나 실명으로만 작성 가능하다. 피드백 게시판이라도 댓글은 익명 옵션 없음.
  const { data, error } = await supabase
    .from("board_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      is_anonymous: false,
      body,
    })
    .select()
    .single();

  if (error) return apiError(500, error.message);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath(`/boards/${slug}/${postId}`);
  return NextResponse.json({
    comment: {
      ...data,
      author_name: profile?.display_name || "이름 없음",
      author_avatar_url: profile?.avatar_url ?? null,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiErrors.badRequest("id가 필요합니다");

  const { error } = await supabase.from("board_comments").delete().eq("id", id);
  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}/${postId}`);
  return NextResponse.json({ success: true });
}
