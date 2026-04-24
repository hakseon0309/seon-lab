import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors } from "@/lib/api-error";

// GET /api/notifications : 내 알림 목록 (최근 30개)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const { data: rows, error } = await supabase
    .from("notifications")
    .select(
      "id, kind, post_id, last_actor_id, preview, unread_count, read_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) return apiError(500, error.message);

  const list = rows ?? [];
  if (list.length === 0) return NextResponse.json({ notifications: [] });

  const postIds = [...new Set(list.map((n) => n.post_id))];
  const actorIds = [
    ...new Set(list.map((n) => n.last_actor_id).filter(Boolean) as string[]),
  ];

  const [{ data: posts }, { data: profiles }, { data: boards }] = await Promise.all([
    supabase
      .from("board_posts")
      .select("id, title, board_id")
      .in("id", postIds),
    actorIds.length > 0
      ? supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    supabase.from("boards").select("id, slug, kind"),
  ]);

  const postMap = new Map(
    ((posts ?? []) as { id: string; title: string; board_id: string }[]).map(
      (p) => [p.id, p]
    )
  );
  const actorMap = new Map(
    ((profiles ?? []) as { id: string; display_name: string | null }[]).map((p) => [
      p.id,
      p.display_name,
    ])
  );
  const boardMap = new Map(
    ((boards ?? []) as { id: string; slug: string; kind: string }[]).map((b) => [
      b.id,
      b,
    ])
  );

  const notifications = list.map((n) => {
    const post = postMap.get(n.post_id);
    const board = post ? boardMap.get(post.board_id) : null;
    return {
      id: n.id,
      kind: n.kind,
      post_id: n.post_id,
      post_title: post?.title ?? "삭제된 글",
      board_slug: board?.slug ?? "",
      board_kind: board?.kind ?? "post",
      last_actor_name: n.last_actor_id ? actorMap.get(n.last_actor_id) ?? null : null,
      preview: n.preview,
      unread_count: n.unread_count,
      read_at: n.read_at,
      updated_at: n.updated_at,
    };
  });

  return NextResponse.json({ notifications });
}
