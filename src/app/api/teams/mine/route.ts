import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors } from "@/lib/api-error";

// GET /api/teams/mine : 내가 속한 팀 목록 (글쓰기 모달의 팀 선택용)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const { data: rows, error } = await supabase
    .from("team_members")
    .select("team_id, teams(id, name)")
    .eq("user_id", user.id);
  if (error) return apiError(500, error.message);

  const teams = (rows ?? [])
    .map((r: { teams: { id: string; name: string } | { id: string; name: string }[] | null }) => {
      const t = Array.isArray(r.teams) ? r.teams[0] : r.teams;
      return t ? { id: t.id, name: t.name } : null;
    })
    .filter((t): t is { id: string; name: string } => Boolean(t));

  return NextResponse.json({ teams });
}
