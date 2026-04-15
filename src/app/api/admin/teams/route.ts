import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

// 팀 is_corp_team 토글
export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { team_id, is_corp_team } = await req.json();
  if (!team_id || typeof is_corp_team !== "boolean") {
    return NextResponse.json({ error: "team_id and is_corp_team required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("teams")
    .update({ is_corp_team })
    .eq("id", team_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
