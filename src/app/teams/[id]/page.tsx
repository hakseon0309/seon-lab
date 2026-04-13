"use client";

import { createClient } from "@/lib/supabase/client";
import { Team, CalendarEvent, UserProfile } from "@/lib/types";
import Nav from "@/components/nav";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import QRCode from "qrcode";

interface MemberWithEvents {
  profile: UserProfile;
  events: CalendarEvent[];
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<MemberWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();

      if (!teamData) {
        router.push("/teams");
        return;
      }
      setTeam(teamData);

      const qr = await QRCode.toDataURL(teamData.invite_code, {
        width: 200,
        margin: 2,
      });
      setQrUrl(qr);

      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", id);

      if (memberError) {
        console.error("team_members 조회 실패:", memberError);
      }

      if (memberData && memberData.length > 0) {
        const userIds = memberData.map((m) => m.user_id);

        const { data: profiles, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .in("id", userIds);

        if (profileError) {
          console.error("user_profiles 조회 실패:", profileError);
        }

        const memberEvents: MemberWithEvents[] = [];
        for (const userId of userIds) {
          const profile = profiles?.find((p) => p.id === userId);
          if (!profile) continue;

          const { data: events } = await supabase
            .from("events")
            .select("*")
            .eq("user_id", userId)
            .order("start_at", { ascending: true });

          memberEvents.push({
            profile: profile as UserProfile,
            events: events || [],
          });
        }
        setMembers(memberEvents);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!team) return null;

  const today = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const weekStarts = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 1 }
  );

  function prevMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-0 lg:px-4 py-4 lg:py-6 pb-24 lg:pb-6">
        <div className="mb-4 flex items-start justify-between px-4 lg:px-0">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {team.name}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {members.length}명의 멤버
            </p>
          </div>
        </div>

        {/* Invite Section */}
        <details
          className="mb-4 lg:mb-6 mx-4 lg:mx-0 rounded-lg border p-4"
          style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
        >
          <summary
            className="cursor-pointer text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            팀 초대하기
          </summary>
          <div className="mt-4 flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                초대 코드
              </p>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-3xl font-bold tracking-[0.3em]"
                  style={{ color: "var(--primary)" }}
                >
                  {team.invite_code}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(team.invite_code)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  복사
                </button>
              </div>
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                팀원에게 이 코드를 알려주세요
              </p>
            </div>

            {qrUrl && (
              <div className="text-center">
                <p
                  className="mb-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  또는 QR 코드를 보여주세요
                </p>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="mx-auto h-[180px] w-[180px] rounded-lg"
                />
              </div>
            )}
          </div>
        </details>

        {/* Month Navigation */}
        <div className="mb-3 flex items-center justify-between px-4 lg:px-0">
          <button
            onClick={prevMonth}
            className="rounded-md px-3 py-1.5 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            &larr; 이전 달
          </button>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-md px-3 py-1.5 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            다음 달 &rarr;
          </button>
        </div>

        {/* Shift Table */}
        <div
          className="overflow-x-hidden lg:rounded-lg border-y lg:border"
          style={{ borderColor: "var(--border-light)" }}
        >
          <table className="w-full table-fixed text-sm">
            <tbody>
              {weekStarts.map((weekStart, weekIdx) => {
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: addDays(weekStart, 6),
                });

                return (
                  <>
                    <tr
                      key={`header-${weekStart.toISOString()}`}
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderTopWidth: weekIdx === 0 ? 0 : 2,
                        borderTopColor: "var(--border)",
                      }}
                    >
                      <td
                        className="sticky left-0 z-10 w-14 lg:w-24"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          borderRight: "1px solid var(--border-light)",
                        }}
                      />
                      {weekDays.map((day) => (
                        <td
                          key={day.toISOString()}
                          className="px-0.5 lg:px-3 py-1.5 lg:py-2 text-center text-xs font-medium"
                          style={{
                            color: isSameDay(day, today)
                              ? "var(--text-primary)"
                              : !isSameMonth(day, currentDate)
                                ? "var(--text-out-of-month)"
                                : "var(--text-secondary)",
                          }}
                        >
                          <div
                            className="text-[10px]"
                            style={{ color: "inherit" }}
                          >
                            {format(day, "EEE", { locale: ko })}
                          </div>
                          <span
                            className="inline-flex items-center justify-center text-[11px]"
                            style={
                              isSameDay(day, today)
                                ? {
                                    width: "1.5rem",
                                    height: "1.5rem",
                                    borderRadius: "9999px",
                                    backgroundColor: "var(--today-bg)",
                                    color: "var(--today-text)",
                                  }
                                : {}
                            }
                          >
                            {format(day, "d")}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {members.map(({ profile, events }, memberIdx) => (
                      <tr
                        key={`${weekStart.toISOString()}-${profile.id}`}
                        style={{
                          borderBottom:
                            memberIdx < members.length - 1
                              ? "1px solid var(--border-light)"
                              : "none",
                        }}
                      >
                        <td
                          className="sticky left-0 z-10 w-14 lg:w-24 px-1.5 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-medium"
                          style={{
                            backgroundColor: "var(--bg-card)",
                            borderRight: "1px solid var(--border-light)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <span className="block truncate">{profile.display_name}</span>
                        </td>
                        {weekDays.map((day) => {
                          const dayEvents = events.filter((e) =>
                            isSameDay(new Date(e.start_at), day)
                          );
                          return (
                            <td
                              key={day.toISOString()}
                              className="px-0.5 lg:px-2 py-1 lg:py-2 text-center align-top"
                              style={{
                                backgroundColor: !isSameMonth(day, currentDate)
                                  ? "var(--bg-out-of-month)"
                                  : "var(--bg-card)",
                              }}
                            >
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className="mb-0.5 rounded px-0.5 lg:px-1.5 py-0.5 lg:py-1 text-[9px] lg:text-[11px] leading-tight"
                                  style={{
                                    backgroundColor: "var(--event-bg)",
                                    color: "var(--event-sub)",
                                  }}
                                >
                                  <div>{format(new Date(event.start_at), "HH:mm")}</div>
                                  <div>{format(new Date(event.end_at), "HH:mm")}</div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
