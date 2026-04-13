"use client";

import { createClient } from "@/lib/supabase/client";
import { formatSeoulTime, getSeoulDateKey } from "@/lib/time";
import { Team, CalendarEvent, UserProfile } from "@/lib/types";
import Nav from "@/components/nav";
import { useEffect, useState, use, Fragment } from "react";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const isLeader = team?.created_by === currentUserId;

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

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
      setNewName(teamData.name);

      const qr = await QRCode.toDataURL(teamData.invite_code, {
        width: 200,
        margin: 2,
      });
      setQrUrl(qr);

      const { data: memberData } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", id);

      if (memberData && memberData.length > 0) {
        const userIds = memberData.map((m) => m.user_id);

        const [{ data: profiles }, { data: allEvents }] = await Promise.all([
          supabase.from("user_profiles").select("*").in("id", userIds),
          supabase
            .from("events")
            .select("*")
            .in("user_id", userIds)
            .order("start_at", { ascending: true }),
        ]);

        const memberEvents: MemberWithEvents[] = [];
        for (const userId of userIds) {
          const profile = profiles?.find((p) => p.id === userId);
          if (!profile) continue;

          memberEvents.push({
            profile: profile as UserProfile,
            events: allEvents?.filter((e) => e.user_id === userId) || [],
          });
        }
        setMembers(memberEvents);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRename() {
    if (!newName.trim() || newName.trim() === team?.name) {
      setEditingName(false);
      return;
    }
    const res = await fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTeam(updated);
    }
    setEditingName(false);
  }

  async function handleRemoveMember(userId: string) {
    const res = await fetch(`/api/teams/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.profile.id !== userId));
    }
  }

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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between px-4 lg:px-0">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename();
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRename}
                  className="text-xl font-bold rounded-md border px-2 py-0.5 focus:outline-none focus:ring-2"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    "--tw-ring-color": "var(--primary)",
                  } as React.CSSProperties}
                />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl font-bold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {team.name}
                </h1>
                {isLeader && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="shrink-0 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    수정
                  </button>
                )}
              </div>
            )}
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {members.length}명의 멤버
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setShowMembers(!showMembers); setShowInvite(false); }}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              멤버
            </button>
            <button
              onClick={() => { setShowInvite(!showInvite); setShowMembers(false); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-on-primary)",
              }}
            >
              초대
            </button>
          </div>
        </div>

        {/* Members Panel */}
        {showMembers && (
          <div
            className="mb-4 mx-4 lg:mx-0 rounded-lg border p-4"
            style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
          >
            <h3
              className="mb-3 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              팀원 목록
            </h3>
            <div className="space-y-2">
              {members.map(({ profile }) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ backgroundColor: "var(--bg-surface)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {profile.display_name}
                    </span>
                    {profile.id === team.created_by && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "var(--text-on-primary)",
                        }}
                      >
                        팀장
                      </span>
                    )}
                  </div>
                  {isLeader && profile.id !== currentUserId && (
                    <button
                      onClick={() => {
                        if (confirm(`${profile.display_name}님을 팀에서 제거할까요?`)) {
                          handleRemoveMember(profile.id);
                        }
                      }}
                      className="text-xs"
                      style={{ color: "var(--error)" }}
                    >
                      제거
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Panel */}
        {showInvite && (
          <div
            className="mb-4 mx-4 lg:mx-0 rounded-lg border p-4"
            style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex flex-col items-center gap-6">
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
          </div>
        )}

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
                  <Fragment key={weekStart.toISOString()}>
                    <tr
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
                          const dayKey = getSeoulDateKey(day);
                          const dayEvents = events.filter(
                            (e) => getSeoulDateKey(e.start_at) === dayKey
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
                                  className="mb-0.5 rounded px-0.5 lg:px-1.5 py-0.5 lg:py-1 text-[11px] lg:text-[13px] leading-tight"
                                  style={{
                                    backgroundColor: "var(--event-bg)",
                                    color: "var(--event-sub)",
                                  }}
                                >
                                  <div>{formatSeoulTime(event.start_at)}</div>
                                  <div>{formatSeoulTime(event.end_at)}</div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
