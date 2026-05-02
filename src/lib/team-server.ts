import {
  CalendarWindow,
  createThreeMonthWindow,
  getCalendarWindowEventRange,
} from "@/lib/calendar-window";
import { createClient } from "@/lib/supabase/server";
import { MemberWithEvents } from "@/lib/team-types";
import {
  getFallbackKoreanHolidays,
  type KoreanHoliday,
} from "@/lib/korean-holidays";
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
  holidays: KoreanHoliday[];
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
  const { from, to, startISO, endISO } =
    getCalendarWindowEventRange(calendarWindow);
  const holidays = getFallbackKoreanHolidays(from, to);
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
        .select("user_id, joined_at, share_schedule")
        .eq("team_id", teamId),
    ]);

  if (!teamData) {
    return {
      team: null,
      isFavorite: false,
      members: [],
      calendarWindow,
      holidays,
    };
  }

  const joinedAtByUser = new Map(
    (memberRows ?? []).map((row: { user_id: string; joined_at: string }) => [
      row.user_id,
      row.joined_at,
    ])
  );
  const shareScheduleByUser = new Map(
    (memberRows ?? []).map(
      (row: { user_id: string; share_schedule: boolean | null }) => [
        row.user_id,
        row.share_schedule ?? true,
      ]
    )
  );
  const userIds = (memberRows ?? []).map((row: { user_id: string }) => row.user_id);
  const visibleEventUserIds = userIds.filter(
    (memberId) => memberId === userId || shareScheduleByUser.get(memberId) !== false
  );

  if (userIds.length === 0) {
    return {
      team: teamData as Team,
      isFavorite: Boolean(favorite),
      members: [],
      calendarWindow,
      holidays,
    };
  }

  const [{ data: profiles }, { data: allEvents }] = await Promise.all([
    supabase.from("user_profiles").select("*").in("id", userIds),
    visibleEventUserIds.length > 0
      ? supabase
          .from("events")
          .select(EVENT_COLUMNS)
          .in("user_id", visibleEventUserIds)
          .gte("start_at", startISO)
          .lt("start_at", endISO)
          .order("start_at", { ascending: true })
      : Promise.resolve({ data: [] }),
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
        shareSchedule: shareScheduleByUser.get(memberId) ?? true,
        events:
          memberId === userId || shareScheduleByUser.get(memberId) !== false
            ? eventsByUser.get(memberId) ?? []
            : [],
      },
    ];
  });

  return {
    team: teamData as Team,
    isFavorite: Boolean(favorite),
    members,
    calendarWindow,
    holidays,
  };
}
