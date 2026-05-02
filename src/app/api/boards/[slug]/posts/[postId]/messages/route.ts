import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { isShiftSwapBoard } from "@/lib/boards";
import { notifyShiftSwapMessageCreated } from "@/lib/push-server";
import { Board, BoardMessage } from "@/lib/types";

export const runtime = "nodejs";

type RouteBoard = Pick<Board, "id" | "slug" | "kind">;
type RoutePost = {
  id: string;
  title: string;
  author_id: string | null;
};

async function loadBoardAndPost(
  slug: string,
  postId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, board: null, post: null };

  const { data: boardData } = await supabase
    .from("boards")
    .select("id, slug, kind")
    .eq("slug", slug)
    .maybeSingle();

  const board = isShiftSwapBoard(boardData as Board | null)
    ? (boardData as RouteBoard)
    : null;

  if (!board) {
    return { supabase, user, board: null, post: null };
  }

  const { data: post } = await supabase
    .from("board_posts")
    .select("id, title, author_id")
    .eq("id", postId)
    .eq("board_id", board.id)
    .maybeSingle();

  return {
    supabase,
    user,
    board,
    post: (post as RoutePost | null) ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const { supabase, user, board, post } = await loadBoardAndPost(slug, postId);
  if (!user) return apiErrors.unauthorized();
  if (!board || !post) return apiErrors.notFound();

  const { data: messages, error } = await supabase
    .from("board_messages")
    .select("id, post_id, author_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return apiError(500, error.message);

  const rows = (messages as BoardMessage[] | null) ?? [];
  const authorIds = [...new Set(rows.map((m) => m.author_id))];
  const profileMap = new Map<
    string,
    { display_name: string | null; avatar_url: string | null }
  >();

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);

    for (const p of (profiles ?? []) as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]) {
      profileMap.set(p.id, {
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      });
    }
  }

  const enriched = rows.map((m) => {
    const p = profileMap.get(m.author_id);
    return {
      ...m,
      author_name: p?.display_name || "이름 없음",
      author_avatar_url: p?.avatar_url ?? null,
    };
  });

  return NextResponse.json({ messages: enriched });
}

type CreateBody = { body?: unknown };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const { supabase, user, board, post } = await loadBoardAndPost(slug, postId);
  if (!user) return apiErrors.unauthorized();
  if (!board || !post) return apiErrors.notFound();

  const parsed = await parseJsonBody<CreateBody>(request);
  if (!parsed.ok) return parsed.response;

  const body = typeof parsed.body.body === "string" ? parsed.body.body.trim() : "";
  if (body.length < 1) return apiErrors.badRequest("메시지를 입력해주세요");
  if (body.length > 4000) {
    return apiErrors.badRequest("메시지는 4000자 이하로 입력해주세요");
  }

  const { data, error } = await supabase
    .from("board_messages")
    .insert({ post_id: postId, author_id: user.id, body })
    .select()
    .single();
  if (error) {
    return apiError(403, "메시지를 보낼 수 없습니다", "forbidden", error.message);
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath(`/boards/${slug}/${postId}`);
  try {
    await notifyShiftSwapMessageCreated({
      postId,
      postTitle: post.title,
      postAuthorId: post.author_id,
      actorId: user.id,
      actorName: profile?.display_name || "이름 없음",
      body,
    });
  } catch {
    // Push delivery should never make message creation fail.
  }

  return NextResponse.json({
    message: {
      ...data,
      author_name: profile?.display_name || "이름 없음",
      author_avatar_url: profile?.avatar_url ?? null,
    },
  });
}
