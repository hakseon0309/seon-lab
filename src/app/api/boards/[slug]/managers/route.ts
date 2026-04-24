import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

async function findBoard(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("boards").select("id").eq("slug", slug).maybeSingle();
  return data?.id as string | undefined;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const boardId = await findBoard(slug);
  if (!boardId) return apiErrors.notFound("게시판을 찾을 수 없습니다");

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("board_managers")
    .select("user_id")
    .eq("board_id", boardId);

  if (error) return apiError(500, error.message);

  const userIds = (rows ?? []).map((r) => r.user_id as string);
  if (userIds.length === 0) return NextResponse.json({ managers: [] });

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const managers = (profiles ?? []).map(
    (p: { id: string; display_name: string | null; avatar_url: string | null }) => ({
      user_id: p.id,
      display_name: p.display_name || "이름 없음",
      avatar_url: p.avatar_url ?? null,
    })
  );

  return NextResponse.json({ managers });
}

type AddBody = { user_id?: unknown };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await requireAdmin();
  if (guard.error) return apiError(guard.status, guard.error, "forbidden");

  const parsed = await parseJsonBody<AddBody>(request);
  if (!parsed.ok) return parsed.response;

  const userId = typeof parsed.body.user_id === "string" ? parsed.body.user_id : "";
  if (!userId) return apiErrors.badRequest("user_id가 필요합니다");

  const boardId = await findBoard(slug);
  if (!boardId) return apiErrors.notFound("게시판을 찾을 수 없습니다");

  const admin = createAdminClient();
  const { error } = await admin
    .from("board_managers")
    .upsert({ board_id: boardId, user_id: userId }, { onConflict: "board_id,user_id" });
  if (error) return apiError(500, error.message);

  const { data: profile } = await admin
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return NextResponse.json({
    manager: {
      user_id: userId,
      display_name: profile?.display_name || "이름 없음",
      avatar_url: profile?.avatar_url ?? null,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await requireAdmin();
  if (guard.error) return apiError(guard.status, guard.error, "forbidden");

  const userId = new URL(request.url).searchParams.get("user_id");
  if (!userId) return apiErrors.badRequest("user_id가 필요합니다");

  const boardId = await findBoard(slug);
  if (!boardId) return apiErrors.notFound("게시판을 찾을 수 없습니다");

  const admin = createAdminClient();
  const { error } = await admin
    .from("board_managers")
    .delete()
    .eq("board_id", boardId)
    .eq("user_id", userId);
  if (error) return apiError(500, error.message);
  return NextResponse.json({ success: true });
}
