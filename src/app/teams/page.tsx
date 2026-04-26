import { createClient } from "@/lib/supabase/server";
import { Team } from "@/lib/types";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import TeamsFooterActions from "@/components/teams-footer-actions";
import CorpTeamSection from "@/components/corp-team-section";
import TeamAvatarControl from "@/components/team-avatar-control";
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
      <main className="mx-auto w-full max-w-lg pb-floating-footer lg:pb-20">
        <div className="page-stack px-4 lg:px-0">
          {showCorp && <CorpTeamSection teams={corpTeams} />}

          {myTeams.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-lg border px-6 py-10 text-center"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                아직 참여한 팀이 없어요
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                아래 버튼으로 팀을 만들거나 초대 코드로 참여해보세요
              </p>
              <span
                aria-hidden="true"
                className="mt-1 text-xl"
                style={{ color: "var(--text-muted)" }}
              >
                ↓
              </span>
            </div>
          ) : (
            <div className="space-y-4">
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
                  <span className="flex min-w-0 items-center gap-3">
                    <TeamAvatarControl team={team} />
                    <span
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {team.name}
                    </span>
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
