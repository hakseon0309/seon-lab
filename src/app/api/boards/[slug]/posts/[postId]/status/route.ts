import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

type Body = { status?: unknown };

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

  const parsed = await parseJsonBody<Body>(request);
  if (!parsed.ok) return parsed.response;
  const next = parsed.body.status;
  if (next !== "requested" && next !== "accepted" && next !== "resolved") {
    return apiErrors.badRequest("status 값이 올바르지 않습니다");
  }

  const { error } = await supabase
    .from("board_posts")
    .update({ status: next })
    .eq("id", postId);

  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}`);
  revalidatePath(`/boards/${slug}/${postId}`);
  return NextResponse.json({ success: true });
}
