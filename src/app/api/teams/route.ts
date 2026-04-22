import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<{ name?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const { name } = parsed.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return apiErrors.badRequest("Team name is required");
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single();

  if (teamError) return apiError(500, teamError.message);

  await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id });

  revalidatePath("/teams");

  return NextResponse.json(team);
}
