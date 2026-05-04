import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

type UpdatePostBody = {
  title?: unknown;
  body?: unknown;
};

async function requireAdminForAdminOnlyBoard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  postId: string,
  userId: string
) {
  const { data: post } = await supabase
    .from("board_posts")
    .select("id, boards!inner(slug, write_role)")
    .eq("id", postId)
    .eq("boards.slug", slug)
    .maybeSingle();

  if (!post) return apiErrors.notFound("글을 찾을 수 없습니다");

  const board = Array.isArray(post.boards) ? post.boards[0] : post.boards;
  if (board?.write_role !== "admin") return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_admin) {
    return apiErrors.forbidden("관리자만 수정하거나 삭제할 수 있습니다");
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const guard = await requireAdminForAdminOnlyBoard(
    supabase,
    slug,
    postId,
    user.id
  );
  if (guard) return guard;

  const parsed = await parseJsonBody<UpdatePostBody>(request);
  if (!parsed.ok) return parsed.response;

  const title = typeof parsed.body.title === "string" ? parsed.body.title.trim() : "";
  const body = typeof parsed.body.body === "string" ? parsed.body.body.trim() : "";
  if (title.length < 2) return apiErrors.badRequest("제목을 2자 이상 입력해주세요");
  if (body.length < 2) return apiErrors.badRequest("내용을 2자 이상 입력해주세요");
  if (title.length > 120) return apiErrors.badRequest("제목은 120자 이하로 입력해주세요");
  if (body.length > 8000) return apiErrors.badRequest("내용은 8000자 이하로 입력해주세요");

  const { error } = await supabase
    .from("board_posts")
    .update({ title, body })
    .eq("id", postId);

  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}`);
  revalidatePath(`/boards/${slug}/${postId}`);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const guard = await requireAdminForAdminOnlyBoard(
    supabase,
    slug,
    postId,
    user.id
  );
  if (guard) return guard;

  const { error } = await supabase.from("board_posts").delete().eq("id", postId);
  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}`);
  return NextResponse.json({ success: true });
}
