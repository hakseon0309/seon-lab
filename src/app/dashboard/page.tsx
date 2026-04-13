"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSeoulDateTime } from "@/lib/time";
import { CalendarEvent, UserProfile } from "@/lib/types";
import Calendar from "@/components/calendar";
import SyncButton from "@/components/sync-button";
import TodayMenu from "@/components/today-menu";
import Nav from "@/components/nav";
import LoadingScreen from "@/components/loading-screen";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [partnerEvents, setPartnerEvents] = useState<CalendarEvent[]>([]);
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

    // 커플 파트너 이벤트 조회
    const coupleRes = await fetch("/api/couples");
    if (coupleRes.ok) {
      const coupleData = await coupleRes.json();
      if (coupleData.status === "accepted" && coupleData.partner_id) {
        const { data: pEvents } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", coupleData.partner_id)
          .order("start_at", { ascending: true });
        setPartnerEvents(pEvents || []);
      } else {
        setPartnerEvents([]);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingScreen />;

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
          <SyncButton lastSynced={profile.last_synced} onSync={() => loadData()} />
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
