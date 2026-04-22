import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { requireTeamOwner } from "@/lib/team-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<{ new_owner_id?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const { new_owner_id } = parsed.body;
  if (!new_owner_id || typeof new_owner_id !== "string") {
    return apiErrors.badRequest("new_owner_id is required");
  }

  const ownerCheck = await requireTeamOwner(supabase, id, user.id);
  if (!ownerCheck.ok) {
    if (ownerCheck.response.status === 403) {
      return apiErrors.forbidden("Only the team leader can transfer ownership");
    }
    return ownerCheck.response;
  }

  if (new_owner_id === user.id) {
    return apiErrors.badRequest("이미 팀장입니다");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id)
    .eq("user_id", new_owner_id)
    .maybeSingle();

  if (!membership) {
    return apiErrors.badRequest("대상이 팀에 속해있지 않습니다");
  }

  const { error } = await supabase
    .from("teams")
    .update({ created_by: new_owner_id })
    .eq("id", id);

  if (error) return apiError(500, error.message);

  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");

  return NextResponse.json({ success: true });
}
