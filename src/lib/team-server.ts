import {
  CalendarWindow,
  createThreeMonthWindow,
  getCalendarWindowEventRange,
} from "@/lib/calendar-window";
import { createClient } from "@/lib/supabase/server";
import { MemberWithEvents } from "@/lib/team-types";
import { CalendarEvent, Team, UserProfile } from "@/lib/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

interface LoadTeamDetailDataParams {
  supabase: ServerSupabase;
  teamId: string;
  userId: string;
}

interface TeamDetailData {
  team: Team | null;
  isFavorite: boolean;
  members: MemberWithEvents[];
  calendarWindow: CalendarWindow;
}

const EVENT_COLUMNS =
  "id, user_id, uid, summary, start_at, end_at, location, created_at";

export async function loadTeamDetailData({
  supabase,
  teamId,
  userId,
}: LoadTeamDetailDataParams): Promise<TeamDetailData> {
  const now = new Date();
  const calendarWindow = createThreeMonthWindow(now);
  const { startISO, endISO } = getCalendarWindowEventRange(calendarWindow);
  const [{ data: teamData }, { data: favorite }, { data: memberRows }] =
    await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
      supabase
        .from("team_favorites")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("team_members")
        .select("user_id, joined_at")
        .eq("team_id", teamId),
    ]);

  if (!teamData) {
    return { team: null, isFavorite: false, members: [], calendarWindow };
  }

  const joinedAtByUser = new Map(
    (memberRows ?? []).map((row: { user_id: string; joined_at: string }) => [
      row.user_id,
      row.joined_at,
    ])
  );
  const userIds = (memberRows ?? []).map((row: { user_id: string }) => row.user_id);

  if (userIds.length === 0) {
    return {
      team: teamData as Team,
      isFavorite: Boolean(favorite),
      members: [],
      calendarWindow,
    };
  }

  const [{ data: profiles }, { data: allEvents }] = await Promise.all([
    supabase.from("user_profiles").select("*").in("id", userIds),
    supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .in("user_id", userIds)
      .gte("start_at", startISO)
      .lt("start_at", endISO)
      .order("start_at", { ascending: true }),
  ]);

  const profileMap = new Map(
    ((profiles ?? []) as UserProfile[]).map((profile) => [profile.id, profile])
  );
  const eventsByUser = new Map<string, CalendarEvent[]>();

  for (const event of (allEvents ?? []) as CalendarEvent[]) {
    const current = eventsByUser.get(event.user_id);
    if (current) {
      current.push(event);
    } else {
      eventsByUser.set(event.user_id, [event]);
    }
  }

  const members: MemberWithEvents[] = userIds.flatMap((memberId) => {
    const profile = profileMap.get(memberId);
    if (!profile) return [];

    return [
      {
        profile,
        joinedAt: joinedAtByUser.get(memberId) ?? null,
        events: eventsByUser.get(memberId) ?? [],
      },
    ];
  });

  return {
    team: teamData as Team,
    isFavorite: Boolean(favorite),
    members,
    calendarWindow,
  };
}
