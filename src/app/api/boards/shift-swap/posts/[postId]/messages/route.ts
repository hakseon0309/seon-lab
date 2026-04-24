import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { BoardMessage } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

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
      profileMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
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
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<CreateBody>(request);
  if (!parsed.ok) return parsed.response;

  const body = typeof parsed.body.body === "string" ? parsed.body.body.trim() : "";
  if (body.length < 1) return apiErrors.badRequest("메시지를 입력해주세요");
  if (body.length > 4000) return apiErrors.badRequest("메시지는 4000자 이하로 입력해주세요");

  const { data, error } = await supabase
    .from("board_messages")
    .insert({ post_id: postId, author_id: user.id, body })
    .select()
    .single();
  if (error) {
    // RLS 에 의해 거부되면 "완료된 글" 또는 "팀 멤버 아님" 으로 해석
    return apiError(403, "메시지를 보낼 수 없습니다", "forbidden", error.message);
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath(`/boards/shift-swap/${postId}`);
  return NextResponse.json({
    message: {
      ...data,
      author_name: profile?.display_name || "이름 없음",
      author_avatar_url: profile?.avatar_url ?? null,
    },
  });
}
