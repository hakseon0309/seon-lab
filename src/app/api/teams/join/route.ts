import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { hasAppAccess, loadAccessProfile } from "@/lib/access-gate";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const accessProfile = await loadAccessProfile(supabase, user.id);
  if (!hasAppAccess(accessProfile)) {
    return apiErrors.forbidden("초대 코드 확인이 필요합니다");
  }

  const parsed = await parseJsonBody<{ invite_code?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const { invite_code } = parsed.body;
  if (!invite_code || typeof invite_code !== "string") {
    return apiErrors.badRequest("invite_code is required");
  }
  const code = invite_code.trim().toUpperCase();

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, invite_expires_at")
    .eq("invite_code", code)
    .single();

  if (!team) return apiErrors.notFound("Invalid invite code");

  if (team.invite_expires_at && new Date(team.invite_expires_at) < new Date()) {
    return apiError(410, "Invite code expired");
  }

  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ team_id: team.id, already_member: true });
  }

  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id });

  if (error) return apiError(500, error.message);

  revalidatePath("/teams");

  return NextResponse.json({ team_id: team.id, team_name: team.name });
}
