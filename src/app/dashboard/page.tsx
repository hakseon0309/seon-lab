import {
  accessCodePath,
  hasAppAccess,
} from "@/lib/access-gate";
import {
  createThreeMonthWindow,
  getCalendarWindowEventRange,
} from "@/lib/calendar-window";
import { getFallbackKoreanHolidays } from "@/lib/korean-holidays";
import { createClient } from "@/lib/supabase/server";
import { formatSeoulDateTime } from "@/lib/time";
import type { CalendarEvent, Team, UserProfile } from "@/lib/types";
import Calendar from "@/components/calendar";
import SyncButton from "@/components/sync-button";
import TodayMenu from "@/components/today-menu";
import FavoriteTeams from "@/components/favorite-teams";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import StandalonePushPrompt from "@/components/standalone-push-prompt";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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

  const calendarWindow = createThreeMonthWindow(new Date());
  const { from, to, startISO, endISO } =
    getCalendarWindowEventRange(calendarWindow);
  const holidays = getFallbackKoreanHolidays(from, to);

  const [profileRes, eventsRes, coupleRes, favoriteRowsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, display_name, ics_url, last_synced, created_at, onboarding_completed_at, access_granted_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("user_id", user.id)
      .gte("start_at", startISO)
      .lt("start_at", endISO)
      .order("start_at", { ascending: true }),
    supabase
      .from("couple_requests")
      .select("requester_id, partner_id, status")
      .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq("status", "accepted")
      .limit(1),
    supabase
      .from("team_favorites")
      .select("team_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = (profileRes.data as UserProfile | null) ?? null;
  if (!hasAppAccess(profile)) {
    redirect(accessCodePath("/dashboard"));
  }

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const events = (eventsRes.data as CalendarEvent[] | null) ?? [];
  const request = coupleRes.data?.[0];
  const partnerId =
    request?.requester_id === user.id ? request.partner_id : request?.requester_id;

  const favoriteTeamIds = (favoriteRowsRes.data ?? []).map(
    (row: { team_id: string }) => row.team_id
  );
  const [partnerEventsRes, favoriteTeamsRes] = await Promise.all([
    partnerId
      ? supabase
          .from("events")
          .select(EVENT_COLUMNS)
          .eq("user_id", partnerId)
          .gte("start_at", startISO)
          .lt("start_at", endISO)
          .order("start_at", { ascending: true })
      : Promise.resolve({ data: [] as CalendarEvent[] }),
    favoriteTeamIds.length > 0
      ? supabase
          .from("teams")
          .select("id, name, image_url")
          .in("id", favoriteTeamIds)
      : Promise.resolve({
          data: [] as Pick<Team, "id" | "name" | "image_url">[],
        }),
  ]);

  const partnerEvents = (partnerEventsRes.data as CalendarEvent[] | null) ?? [];
  const showCalendarSetupHint =
    !profile.ics_url && events.length === 0 && partnerEvents.length === 0;
  const teamById = new Map(
    ((favoriteTeamsRes.data as Pick<Team, "id" | "name" | "image_url">[] | null) ??
      []).map((team) => [team.id, team])
  );
  const favoriteTeams = favoriteTeamIds
    .map((teamId) => teamById.get(teamId))
    .filter(
      (team): team is Pick<Team, "id" | "name" | "image_url"> => Boolean(team)
    );

  return (
    <>
      <RouteTransitionDone />
      <StandalonePushPrompt userId={user.id} />
      <Nav />
      <PageHeader>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            내 근무
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
            calendarWindow={calendarWindow}
            holidays={holidays}
            showSetupHint={showCalendarSetupHint}
          />
        </div>

        <FavoriteTeams teams={favoriteTeams} />

        <Suspense fallback={null}>
          <TodayMenu />
        </Suspense>
      </main>
    </>
  );
}
