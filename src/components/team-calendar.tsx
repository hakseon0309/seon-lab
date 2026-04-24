"use client";

import { memo, Fragment, useEffect, useMemo, useRef } from "react";
import AvatarImage from "@/components/avatar-image";
import { formatSeoulTime, getSeoulDateKey } from "@/lib/time";
import { CalendarEvent, UserProfile } from "@/lib/types";
import { weekendOverlay, cellBackground } from "@/lib/calendar-style";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  members: { profile: UserProfile; events: CalendarEvent[] }[];
  currentDate: Date;
}

function TeamCalendar({ members, currentDate }: Props) {
  const today = useMemo(() => new Date(), []);
  const todayWeekRef = useRef<HTMLTableRowElement | null>(null);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const weekStarts = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 1 }
  );
  const todayKey = getSeoulDateKey(today);
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aStart = getEarliestStartForDay(a.events, todayKey);
      const bStart = getEarliestStartForDay(b.events, todayKey);

      if (aStart !== bStart) {
        if (aStart === null) return 1;
        if (bStart === null) return -1;
        return aStart - bStart;
      }

      return a.profile.display_name.localeCompare(
        b.profile.display_name,
        ["ko", "en"],
        { sensitivity: "base" }
      );
    });
  }, [members, todayKey]);

  useEffect(() => {
    if (!isSameMonth(today, currentDate)) return;

    const frame = window.requestAnimationFrame(() => {
      todayWeekRef.current?.scrollIntoView({
        block: "start",
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentDate, today]);

  return (
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

            const hasTodayInWeek = weekDays.some((day) => isSameDay(day, today));

            return (
              <Fragment key={weekStart.toISOString()}>
                <tr
                  ref={hasTodayInWeek ? todayWeekRef : undefined}
                  className="scroll-mt-32"
                  style={{ backgroundColor: "var(--bg-surface)" }}
                >
                  <td
                    className="sticky left-0 z-10 w-20 lg:w-32"
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
                        className="px-0.5 lg:px-3 py-1.5 lg:py-2 text-center text-xs font-medium relative"
                        style={{
                          color: headerColor,
                          ...headerBg,
                          borderTop: weekIdx > 0 ? "1px solid var(--border)" : undefined,
                          borderLeft: "1px solid var(--border-light)",
                          ...(isToday && { outline: "1.5px solid var(--today-border)", outlineOffset: "-1.5px", zIndex: 1 }),
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

                {sortedMembers.map(({ profile, events }) => (
                  <tr key={`${weekStart.toISOString()}-${profile.id}`}>
                    <td
                      className="sticky left-0 z-10 w-20 lg:w-32 px-1 lg:px-2 py-1.5 lg:py-2 text-xs lg:text-sm font-medium"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderRight: "1px solid var(--border-light)",
                        borderTop: "1px solid var(--border-light)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <AvatarImage
                          src={profile.avatar_url}
                          name={profile.display_name}
                          sizeClass="h-6 w-6 lg:h-7 lg:w-7"
                          textClass="text-[10px]"
                        />
                        <span className="block min-w-0 truncate">
                          {profile.display_name}
                        </span>
                      </span>
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
                          className="px-0.5 lg:px-1.5 py-1 lg:py-2 text-center align-top"
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
  );
}

export default memo(TeamCalendar);

function getEarliestStartForDay(events: CalendarEvent[], dayKey: string) {
  let earliest: number | null = null;

  for (const event of events) {
    if (getSeoulDateKey(event.start_at) !== dayKey) continue;
    const start = new Date(event.start_at).getTime();
    if (earliest === null || start < earliest) earliest = start;
  }

  return earliest;
}
