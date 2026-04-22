import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { apiError, apiErrors } from "@/lib/api-error";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) {
    return apiError(guard.status, guard.error, "forbidden");
  }

  const { team_id, is_corp_team } = await req.json();
  if (!team_id || typeof is_corp_team !== "boolean") {
    return apiErrors.badRequest("team_id, is_corp_team이 필요합니다");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("teams")
    .update({ is_corp_team })
    .eq("id", team_id);

  if (error) return apiErrors.server("팀 업데이트에 실패했습니다", error.message);
  revalidatePath("/admin");
  revalidatePath("/teams");
  return NextResponse.json({ success: true });
}
