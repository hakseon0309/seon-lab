import {
  CalendarWindow,
  createThreeMonthWindow,
  getCalendarWindowEventRange,
} from "@/lib/calendar-window";
import { createAdminClient } from "@/lib/supabase/admin";
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
const TEAM_COLUMNS =
  "id, name, invite_code, invite_expires_at, is_corp_team, image_url, image_path, created_by, created_at";
const MEMBER_PROFILE_COLUMNS =
  "id, display_name, ics_url, last_synced, is_admin, avatar_url, avatar_path, onboarding_completed_at, created_at";

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
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  const dataClient = profile?.is_admin ? createAdminClient() : supabase;

  const [{ data: teamData }, { data: favorite }, { data: memberRows }] =
    await Promise.all([
      dataClient.from("teams").select(TEAM_COLUMNS).eq("id", teamId).maybeSingle(),
      dataClient
        .from("team_favorites")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle(),
      dataClient
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
    dataClient.from("user_profiles").select(MEMBER_PROFILE_COLUMNS).in("id", userIds),
    visibleEventUserIds.length > 0
      ? dataClient
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
