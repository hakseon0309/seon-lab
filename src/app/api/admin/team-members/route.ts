import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { apiError, apiErrors } from "@/lib/api-error";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return apiError(guard.status, guard.error, "forbidden");
  }

  const { user_id, team_id } = await req.json();
  if (!user_id || !team_id) {
    return apiErrors.badRequest("user_id, team_id가 필요합니다");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .insert({ user_id, team_id })
    .select()
    .single();

  if (error && !error.message.includes("duplicate")) {
    return apiErrors.server("팀원 추가에 실패했습니다", error.message);
  }
  revalidatePath("/admin");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return apiError(guard.status, guard.error, "forbidden");
  }

  const { user_id, team_id } = await req.json();
  if (!user_id || !team_id) {
    return apiErrors.badRequest("user_id, team_id가 필요합니다");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("user_id", user_id)
    .eq("team_id", team_id);

  if (error) return apiErrors.server("팀원 제거에 실패했습니다", error.message);
  revalidatePath("/admin");
  return NextResponse.json({ success: true });
}
