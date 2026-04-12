"use client";

import { createClient } from "@/lib/supabase/client";
import { CalendarEvent, UserProfile } from "@/lib/types";
import Calendar from "@/components/calendar";
import SyncButton from "@/components/sync-button";
import Nav from "@/components/nav";
import { useEffect, useState } from "react";
import { format, isAfter, isBefore, addDays, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const [profileRes, eventsRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_at", { ascending: true }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          로딩 중...
        </div>
      </div>
    );
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
            캘린더 URL을 등록해주세요
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            설정 페이지에서 Apple 캘린더 구독 URL을 입력하면 시프트가 표시됩니다.
          </p>
          <button
            onClick={() => router.push("/settings")}
            className="mt-6 rounded-lg px-6 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            설정으로 이동
          </button>
        </div>
      </>
    );
  }

  const now = startOfDay(new Date());
  const weekLater = addDays(now, 7);
  const upcomingEvents = events.filter((e) => {
    const start = new Date(e.start_at);
    return isAfter(start, now) && isBefore(start, weekLater);
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-0 lg:px-4 py-4 lg:py-6 pb-24 lg:pb-6">
        <div className="mb-4 flex items-center justify-between px-4 lg:px-0">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              내 시프트
            </h1>
            {profile.last_synced && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                마지막 동기화:{" "}
                {format(new Date(profile.last_synced), "M/d HH:mm", {
                  locale: ko,
                })}
              </p>
            )}
          </div>
          <SyncButton
            lastSynced={profile.last_synced}
            onSync={() => loadData()}
          />
        </div>

        <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_300px]">
          <Calendar events={events} />

          <div className="px-4 lg:px-0">
            <h3
              className="mb-3 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              다가오는 시프트
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                예정된 시프트가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border p-3"
                    style={{
                      borderColor: "var(--border-light)",
                      backgroundColor: "var(--bg-card)",
                    }}
                  >
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {event.summary}
                    </div>
                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {format(new Date(event.start_at), "M/d(EEE) HH:mm", {
                        locale: ko,
                      })}{" "}
                      - {format(new Date(event.end_at), "HH:mm")}
                    </div>
                    {event.location && (
                      <div
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
