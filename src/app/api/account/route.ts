import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiErrors } from "@/lib/api-error";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const { data: ownedTeams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("created_by", user.id);

  if (ownedTeams && ownedTeams.length > 0) {
    return NextResponse.json(
      {
        error:
          "팀장으로 있는 팀이 있어 탈퇴할 수 없습니다. 먼저 팀장을 위임해주세요.",
        code: "owns_teams",
        teams: ownedTeams,
      },
      { status: 409 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return apiErrors.server("탈퇴 처리에 실패했습니다", error.message);
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
