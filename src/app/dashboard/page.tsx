import { createClient } from "@/lib/supabase/server";
import { formatSeoulDateTime } from "@/lib/time";
import { CalendarEvent, UserProfile } from "@/lib/types";
import Calendar from "@/components/calendar";
import SyncButton from "@/components/sync-button";
import TodayMenu from "@/components/today-menu";
import Nav from "@/components/nav";
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

  if (!profile?.ics_url) {
    return (
      <>
        <Nav />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            캘린더 구독 URL을 등록해주세요
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-sm leading-7"
            style={{ color: "var(--text-muted)" }}
          >
            설정에서 캘린더 구독 URL을 입력하면
            <br className="lg:hidden" />
            <span className="hidden lg:inline"> </span>
            시프트가 자동으로 입력되고 표시됩니다.
          </p>
          <Link
            href="/settings"
            className="mt-8 inline-flex rounded-lg px-6 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            설정으로 이동
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-0 lg:px-4 py-4 pb-24 lg:py-6 lg:pb-6">
        <div className="mb-4 flex items-center justify-between gap-3 px-4 lg:px-0">
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
        </div>

        <div className="w-full">
          <Calendar
            events={events}
            partnerEvents={partnerEvents}
          />
        </div>

        <TodayMenu />
      </main>
    </>
  );
}
