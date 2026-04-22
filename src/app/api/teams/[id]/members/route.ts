import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { requireTeamOwner } from "@/lib/team-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const ownerCheck = await requireTeamOwner(supabase, id, user.id);
  if (!ownerCheck.ok) return ownerCheck.response;

  const parsed = await parseJsonBody<{ userId?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const { userId } = parsed.body;

  if (!userId || typeof userId !== "string" || userId === user.id) {
    return apiErrors.badRequest("Invalid request");
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", id)
    .eq("user_id", userId);

  if (error) return apiError(500, error.message);

  revalidatePath(`/teams/${id}`);

  return NextResponse.json({ success: true });
}
