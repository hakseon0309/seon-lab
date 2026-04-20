import { createClient } from "@/lib/supabase/server";
import { Team } from "@/lib/types";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import TeamsFooterActions from "@/components/teams-footer-actions";
import CorpTeamSection from "@/components/corp-team-section";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, membershipsRes, corpRes] = await Promise.all([
    supabase.from("user_profiles").select("ics_url").eq("id", user.id).single(),
    supabase.from("team_members").select("team_id").eq("user_id", user.id),
    supabase.from("teams").select("*").eq("is_corp_team", true).order("name"),
  ]);

  const icsUrl = profileRes.data?.ics_url ?? "";
  const isCorpUser = icsUrl.includes("sm-cal.apple.com");

  const memberTeamIds = new Set(
    (membershipsRes.data ?? []).map((m: { team_id: string }) => m.team_id)
  );

  let myTeams: Team[] = [];
  if (memberTeamIds.size > 0) {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .in("id", [...memberTeamIds])
      .order("created_at", { ascending: false });
    myTeams = (data as Team[] | null) ?? [];
  }

  const hasJoinedCorpTeam = myTeams.some((t) => t.is_corp_team);
  const corpTeams = ((corpRes.data as Team[] | null) ?? []).filter(
    (t) => !memberTeamIds.has(t.id)
  );
  const showCorp = isCorpUser && !hasJoinedCorpTeam && corpTeams.length > 0;

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          팀
        </h1>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg py-6 lg:py-8 pb-36 lg:pb-20">
        <div className="page-stack">
          {showCorp && <CorpTeamSection teams={corpTeams} />}

          {myTeams.length === 0 ? (
            <div
              className="mx-4 lg:mx-0 rounded-lg border p-6 text-center"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                아직 참여한 팀이 없습니다. 팀을 생성하거나 초대 코드로 참여하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4 px-4 lg:px-0">
              {myTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="interactive-press flex items-center justify-between rounded-lg border p-4"
                  style={{
                    borderColor: "var(--border-light)",
                    backgroundColor: "var(--bg-card)",
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {team.name}
                    {team.is_corp_team && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        🏢
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <TeamsFooterActions />
    </>
  );
}
