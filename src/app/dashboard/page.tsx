import { createClient } from "@/lib/supabase/server";
import { formatSeoulDateTime } from "@/lib/time";
import { CalendarEvent, Team, UserProfile } from "@/lib/types";
import Calendar from "@/components/calendar";
import SyncButton from "@/components/sync-button";
import TodayMenu from "@/components/today-menu";
import FavoriteTeams from "@/components/favorite-teams";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addMonths, startOfMonth, subMonths } from "date-fns";

const EVENT_COLUMNS =
  "id, user_id, uid, summary, start_at, end_at, location, created_at";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const rangeStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
  const rangeEnd = startOfMonth(addMonths(new Date(), 6)).toISOString();

  const [profileRes, eventsRes, coupleRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, display_name, ics_url, last_synced, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("user_id", user.id)
      .gte("start_at", rangeStart)
      .lt("start_at", rangeEnd)
      .order("start_at", { ascending: true }),
    supabase
      .from("couple_requests")
      .select("requester_id, partner_id, status")
      .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq("status", "accepted")
      .limit(1),
  ]);

  const profile = (profileRes.data as UserProfile | null) ?? null;
  const events = (eventsRes.data as CalendarEvent[] | null) ?? [];
  const request = coupleRes.data?.[0];
  const partnerId =
    request?.requester_id === user.id ? request.partner_id : request?.requester_id;

  let partnerEvents: CalendarEvent[] = [];
  if (partnerId) {
    const { data } = await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("user_id", partnerId)
      .gte("start_at", rangeStart)
      .lt("start_at", rangeEnd)
      .order("start_at", { ascending: true });
    partnerEvents = (data as CalendarEvent[] | null) ?? [];
  }

  const { data: favoriteRows } = await supabase
    .from("team_favorites")
    .select("team_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favoriteTeamIds = (favoriteRows ?? []).map(
    (row: { team_id: string }) => row.team_id
  );
  let favoriteTeams: Team[] = [];
  if (favoriteTeamIds.length > 0) {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .in("id", favoriteTeamIds);
    const teamById = new Map(
      ((data as Team[] | null) ?? []).map((team) => [
        team.id,
        team,
      ])
    );
    favoriteTeams = favoriteTeamIds
      .map((teamId) => teamById.get(teamId))
      .filter((team): team is Team => Boolean(team));
  }

  if (!profile?.ics_url) {
    return (
      <>
        <RouteTransitionDone />
        <Nav />
        <PageHeader>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            내 시프트
          </h1>
        </PageHeader>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-tabbar lg:pb-8 text-center">
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            캘린더 구독 URL을 등록해주세요
          </h2>
          <p
            className="mt-3 max-w-sm text-sm leading-7"
            style={{ color: "var(--text-muted)" }}
          >
            설정에서 캘린더 구독 URL을 입력하면
            <br className="lg:hidden" />
            <span className="hidden lg:inline"> </span>
            시프트가 자동으로 입력되고 표시됩니다.
          </p>
          <Link
            href="/settings"
            className="interactive-press mt-8 inline-flex rounded-lg px-6 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            설정으로 이동
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            내 시프트
          </h1>
          {profile.last_synced && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              마지막 동기화: {formatSeoulDateTime(profile.last_synced)}
            </p>
          )}
        </div>
        <SyncButton lastSynced={profile.last_synced} />
      </PageHeader>
      <main className="mx-auto w-full max-w-5xl px-0 lg:px-4 pb-tabbar lg:pb-6">
        <div className="w-full">
          <Calendar
            events={events}
            partnerEvents={partnerEvents}
          />
        </div>

        <FavoriteTeams teams={favoriteTeams} />

        <TodayMenu />
      </main>
    </>
  );
}
