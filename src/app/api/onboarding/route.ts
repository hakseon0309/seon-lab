import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { CORP_TEAM_NAMES, isCorpTeamName } from "@/lib/corp-teams";
import { createClient } from "@/lib/supabase/server";

type OnboardingBody = {
  display_name?: unknown;
  ics_url?: unknown;
  team_names?: unknown;
};

type TeamRow = {
  id: string;
  name: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<OnboardingBody>(request);
  if (!parsed.ok) return parsed.response;

  const displayName =
    typeof parsed.body.display_name === "string"
      ? parsed.body.display_name.trim()
      : "";
  const icsUrl =
    typeof parsed.body.ics_url === "string" ? parsed.body.ics_url.trim() : "";
  const teamNames = Array.isArray(parsed.body.team_names)
    ? parsed.body.team_names
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim().toUpperCase())
        .filter(isCorpTeamName)
    : [];

  if (!displayName) {
    return apiErrors.badRequest("이름을 입력해주세요");
  }

  const uniqueTeamNames = [...new Set(teamNames)];
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      display_name: displayName,
      ics_url: icsUrl || null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return apiError(
      500,
      "프로필 저장에 실패했습니다",
      "profile_update_failed",
      profileError.message
    );
  }

  if (uniqueTeamNames.length > 0) {
    const { data: existingTeams, error: teamLoadError } = await supabase
      .from("teams")
      .select("id, name")
      .in("name", CORP_TEAM_NAMES);

    if (teamLoadError) {
      return apiError(500, "팀 목록을 불러오지 못했습니다", "team_load_failed", teamLoadError.message);
    }

    const teamsByName = new Map(
      ((existingTeams ?? []) as TeamRow[]).map((team) => [
        team.name.toUpperCase(),
        team,
      ])
    );
    const missingTeamNames = uniqueTeamNames.filter(
      (name) => !teamsByName.has(name)
    );

    if (missingTeamNames.length > 0) {
      const { data: createdTeams, error: createTeamError } = await supabase
        .from("teams")
        .insert(
          missingTeamNames.map((name) => ({
            name,
            created_by: user.id,
            is_corp_team: true,
          }))
        )
        .select("id, name");

      if (createTeamError) {
        return apiError(
          500,
          "팀을 준비하지 못했습니다",
          "team_create_failed",
          createTeamError.message
        );
      }

      for (const team of (createdTeams ?? []) as TeamRow[]) {
        teamsByName.set(team.name.toUpperCase(), team);
      }
    }

    const memberships = uniqueTeamNames
      .map((name) => teamsByName.get(name))
      .filter((team): team is TeamRow => Boolean(team))
      .map((team) => ({
        team_id: team.id,
        user_id: user.id,
        share_schedule: true,
      }));

    if (memberships.length > 0) {
      const { error: memberError } = await supabase
        .from("team_members")
        .upsert(memberships, { onConflict: "team_id,user_id" });

      if (memberError) {
        return apiError(
          500,
          "팀 가입에 실패했습니다",
          "team_join_failed",
          memberError.message
        );
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath("/settings");

  return NextResponse.json({ success: true, has_ics_url: Boolean(icsUrl) });
}
