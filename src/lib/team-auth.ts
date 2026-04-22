import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiErrors } from "@/lib/api-error";

type AuthOk = { ok: true; team: { created_by: string } };
type AuthErr = { ok: false; response: NextResponse };

export async function requireTeamOwner(
  supabase: SupabaseClient,
  teamId: string,
  userId: string
): Promise<AuthOk | AuthErr> {
  const { data: team } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (!team) return { ok: false, response: apiErrors.notFound("Team not found") };
  if (team.created_by !== userId) return { ok: false, response: apiErrors.forbidden() };
  return { ok: true, team };
}
