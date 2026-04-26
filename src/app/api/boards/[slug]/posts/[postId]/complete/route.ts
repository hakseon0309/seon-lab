import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { isShiftSwapBoard } from "@/lib/boards";
import { Board } from "@/lib/types";

type Body = { status?: unknown };
type RouteBoard = Pick<Board, "id" | "slug" | "kind">;

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

  const { data: boardData } = await supabase
    .from("boards")
    .select("id, slug, kind")
    .eq("slug", slug)
    .maybeSingle();
  const board = isShiftSwapBoard(boardData as Board | null)
    ? (boardData as RouteBoard)
    : null;
  if (!board) {
    return apiErrors.notFound();
  }

  const parsed = await parseJsonBody<Body>(request);
  if (!parsed.ok) return parsed.response;
  const next = parsed.body.status;
  if (next !== "open" && next !== "done") {
    return apiErrors.badRequest("status 값이 올바르지 않습니다");
  }

  const { data: post } = await supabase
    .from("board_posts")
    .select("author_id")
    .eq("id", postId)
    .eq("board_id", board.id)
    .maybeSingle();
  if (!post) return apiErrors.notFound();
  if (post.author_id !== user.id) {
    return apiErrors.forbidden("작성자만 상태를 변경할 수 있어요");
  }

  const update = {
    swap_status: next,
    completed_at: next === "done" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("board_posts")
    .update(update)
    .eq("id", postId);
  if (error) return apiError(500, error.message);

  revalidatePath(`/boards/${slug}`);
  revalidatePath(`/boards/${slug}/${postId}`);
  return NextResponse.json({ success: true, swap_status: next });
}
