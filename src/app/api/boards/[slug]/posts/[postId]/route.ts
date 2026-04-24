import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

type UpdatePostBody = {
  title?: unknown;
  body?: unknown;
};

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

  const { error } = await supabase.from("board_posts").delete().eq("id", postId);
  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}`);
  return NextResponse.json({ success: true });
}
