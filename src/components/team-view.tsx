"use client";

import { formatSeoulTime, getSeoulDateKey } from "@/lib/time";
import { Team, CalendarEvent, UserProfile } from "@/lib/types";
import PageHeader from "@/components/page-header";
import { useEffect, useState, Fragment } from "react";
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

export interface MemberWithEvents {
  profile: UserProfile;
  events: CalendarEvent[];
}

interface Props {
  team: Team;
  initialMembers: MemberWithEvents[];
  currentUserId: string;
}

export default function TeamView({ team: initialTeam, initialMembers, currentUserId }: Props) {
  const [team, setTeam] = useState(initialTeam);
  const [members, setMembers] = useState(initialMembers);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(initialTeam.name);
  const [qrUrl, setQrUrl] = useState("");
  const [renameError, setRenameError] = useState("");
  const router = useRouter();

  const isLeader = team.created_by === currentUserId;

  useEffect(() => {
    QRCode.toDataURL(team.invite_code, { width: 200, margin: 2 }).then(setQrUrl);
  }, [team.invite_code]);

  async function handleRename() {
    if (!newName.trim() || newName.trim() === team.name) {
      setEditingName(false);
      return;
    }
    setRenameError("");
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTeam(updated);
      setEditingName(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setRenameError(data.error || "이름 변경에 실패했습니다");
    }
  }

  async function handleRemoveMember(userId: string) {
    const res = await fetch(`/api/teams/${team.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.profile.id !== userId));
      router.refresh();
    }
  }

  const today = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const weekStarts = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 1 }
  );

  function weekendOverlay(day: Date, inMonth: boolean) {
    const dow = day.getDay();
    if (dow === 6) return {
      text: inMonth ? "var(--weekend-sat-text)" : "var(--text-out-of-month)",
      overlay: inMonth ? "var(--overlay-weekend-sat)" : "var(--overlay-weekend-sat-dim)",
    };
    if (dow === 0) return {
      text: inMonth ? "var(--weekend-sun-text)" : "var(--text-out-of-month)",
      overlay: inMonth ? "var(--overlay-weekend-sun)" : "var(--overlay-weekend-sun-dim)",
    };
    return null;
  }

  function cellBackground(day: Date, inMonth: boolean) {
    const weekend = weekendOverlay(day, inMonth);
    const base = inMonth ? "var(--bg-card)" : "var(--bg-out-of-month)";
    const overlays: string[] = [];
    if (weekend) overlays.push(`linear-gradient(${weekend.overlay},${weekend.overlay})`);
    return {
      backgroundColor: base,
      ...(overlays.length > 0 && { backgroundImage: overlays.join(",") }),
    };
  }

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
      <PageHeader>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div>
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
                  onChange={(e) => { setNewName(e.target.value); setRenameError(""); }}
                  className="text-lg font-bold rounded-md border px-2 py-0.5 focus:outline-none focus:ring-2"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--input-bg)",
                    borderColor: renameError ? "var(--error)" : "var(--input-border)",
                    "--tw-ring-color": "var(--primary)",
                  } as React.CSSProperties}
                />
                <button
                  type="submit"
                  className="shrink-0 text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setRenameError(""); setNewName(team.name); }}
                  className="shrink-0 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  취소
                </button>
              </form>
              {renameError && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--error)" }}>
                  {renameError}
                </p>
              )}
            </div>
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
      </PageHeader>
      <main className="mx-auto max-w-5xl px-0 lg:px-4 py-4 lg:py-6 pb-24 lg:pb-6">
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

        <div className="mb-3 flex items-center justify-between px-4 lg:px-0">
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base font-medium"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-card)" }}
          >
            &lt;
          </button>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base font-medium"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-card)" }}
          >
            &gt;
          </button>
        </div>

        <div
          className="overflow-x-hidden lg:rounded-lg border-y lg:border"
          style={{ borderColor: "var(--border-light)" }}
        >
          <table
            className="w-full table-fixed text-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              {weekStarts.map((weekStart, weekIdx) => {
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: addDays(weekStart, 6),
                });

                return (
                  <Fragment key={weekStart.toISOString()}>
                    <tr style={{ backgroundColor: "var(--bg-surface)" }}>
                      <td
                        className="sticky left-0 z-10 w-14 lg:w-24"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          borderRight: "1px solid var(--border-light)",
                          borderTop: weekIdx > 0 ? "1px solid var(--border)" : undefined,
                        }}
                      />
                      {weekDays.map((day) => {
                        const inMonth = isSameMonth(day, currentDate);
                        const ws = weekendOverlay(day, inMonth);
                        const headerColor = ws
                          ? ws.text
                          : inMonth
                            ? "var(--text-secondary)"
                            : "var(--text-out-of-month)";
                        const headerBg = cellBackground(day, inMonth);
                        const isToday = isSameDay(day, today);
                        return (
                          <td
                            key={day.toISOString()}
                            className="px-0.5 lg:px-3 py-1.5 lg:py-2 text-center text-xs font-medium"
                            style={{
                              color: headerColor,
                              ...headerBg,
                              borderTop: weekIdx > 0 ? "1px solid var(--border)" : undefined,
                              borderLeft: "1px solid var(--border-light)",
                              ...(isToday && { boxShadow: "inset 0 0 0 1.5px var(--today-border)" }),
                            }}
                          >
                            <div className="text-[10px]" style={{ color: "inherit" }}>
                              {format(day, "EEE", { locale: ko })}
                            </div>
                            <span
                              className={`inline-flex items-center justify-center text-[11px] ${isToday ? "font-bold" : ""}`}
                            >
                              {format(day, "d")}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {members.map(({ profile, events }) => (
                      <tr
                        key={`${weekStart.toISOString()}-${profile.id}`}
                      >
                        <td
                          className="sticky left-0 z-10 w-14 lg:w-24 px-1.5 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-medium"
                          style={{
                            backgroundColor: "var(--bg-card)",
                            borderRight: "1px solid var(--border-light)",
                            borderTop: "1px solid var(--border-light)",
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
                          const inMonth = isSameMonth(day, currentDate);
                          const bg = cellBackground(day, inMonth);
                          return (
                            <td
                              key={day.toISOString()}
                              className="px-0.5 lg:px-2 py-1 lg:py-2 text-center align-top"
                              style={{
                                ...bg,
                                borderTop: "1px solid var(--border-light)",
                                borderLeft: "1px solid var(--border-light)",
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
