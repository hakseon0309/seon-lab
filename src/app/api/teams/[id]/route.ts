import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { requireTeamOwner } from "@/lib/team-auth";

export async function PATCH(
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

  const parsed = await parseJsonBody<{ name?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const { name } = parsed.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return apiErrors.badRequest("Team name is required");
  }

  const { data, error } = await supabase
    .from("teams")
    .update({ name: name.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) return apiError(500, error.message);

  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");

  return NextResponse.json(data);
}
