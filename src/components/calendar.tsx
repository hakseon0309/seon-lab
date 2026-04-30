"use client";

import CalendarMonthNavigator from "@/components/calendar-month-navigator";
import {
  CalendarWindow,
  createThreeMonthWindow,
  isWindowEndMonth,
  isWindowStartMonth,
  parseMonthKey,
} from "@/lib/calendar-window";
import { CalendarEvent } from "@/lib/types";
import { formatSeoulTime, getSeoulDateKey } from "@/lib/time";
import { weekendOverlay, cellBackground } from "@/lib/calendar-style";
import {
  getKoreanHolidayByDateKey,
  getKoreanHolidayFromList,
} from "@/lib/korean-holidays";
import type { KoreanHoliday } from "@/lib/korean-holidays";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { useMemo, useState } from "react";

interface CalendarProps {
  events: CalendarEvent[];
  partnerEvents?: CalendarEvent[];
  calendarWindow?: CalendarWindow;
  holidays?: KoreanHoliday[];
}

export default function Calendar({
  events,
  partnerEvents = [],
  calendarWindow,
  holidays = [],
}: CalendarProps) {
  const resolvedWindow = useMemo(
    () => calendarWindow ?? createThreeMonthWindow(new Date()),
    [calendarWindow]
  );
  const [currentDate, setCurrentDate] = useState(() =>
    parseMonthKey(resolvedWindow.initialMonth)
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const previousDisabled = isWindowStartMonth(currentDate, resolvedWindow);
  const nextDisabled = isWindowEndMonth(currentDate, resolvedWindow);
  const myEventsByDayKey = useMemo(() => groupEventsByDayKey(events), [events]);
  const partnerEventsByDayKey = useMemo(
    () => groupEventsByDayKey(partnerEvents),
    [partnerEvents]
  );

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <section className="w-full min-w-0">
      <CalendarMonthNavigator
        currentDate={currentDate}
        previousDisabled={previousDisabled}
        nextDisabled={nextDisabled}
        onPrevious={() =>
          setCurrentDate(
            previousDisabled
              ? currentDate
              : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
          )
        }
        onNext={() =>
          setCurrentDate(
            nextDisabled
              ? currentDate
              : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
          )
        }
      />

      <div
        className="grid w-full min-w-0 grid-cols-7 gap-px overflow-hidden border-y lg:rounded-lg lg:border"
        style={{
          borderColor: "var(--border-light)",
          backgroundColor: "var(--border-light)",
        }}
      >
        {weekDays.map((day, idx) => {
          const isSat = idx === 5;
          const isSun = idx === 6;
          const color = isSat
            ? "var(--weekend-sat-text)"
            : isSun
              ? "var(--weekend-sun-text)"
              : "var(--text-muted)";
          const headerBg = isSat
            ? "var(--overlay-weekend-sat)"
            : isSun
              ? "var(--overlay-weekend-sun)"
              : undefined;
          return (
            <div
              key={day}
              className="py-2 text-center text-[11px] font-medium sm:text-xs lg:py-2.5"
              style={{
                backgroundColor: "var(--bg-surface)",
                backgroundImage: headerBg ? `linear-gradient(${headerBg},${headerBg})` : undefined,
                color,
              }}
            >
              {day}
            </div>
          );
        })}
        {days.map((day) => {
          const dayKey = getSeoulDateKey(day);
          const myDayEvents = myEventsByDayKey.get(dayKey) ?? [];
          const partnerDayEvents = partnerEventsByDayKey.get(dayKey) ?? [];
          const holiday =
            getKoreanHolidayFromList(dayKey, holidays) ??
            getKoreanHolidayByDateKey(dayKey);
          const inMonth = isSameMonth(day, currentDate);
          const weekend = weekendOverlay(day, inMonth);
          const bg = cellBackground(day, inMonth);
          const dayNumColor = weekend
            ? weekend.text
            : inMonth
              ? "var(--text-secondary)"
              : "var(--text-out-of-month)";
          const todayStyle = isToday(day)
            ? { ...bg, outline: "1.5px solid var(--today-border)", outlineOffset: "-1.5px", position: "relative" as const, zIndex: 1 }
            : bg;
          return (
            <div
              key={day.toISOString()}
              className="relative min-h-[82px] overflow-hidden p-1 pb-6 sm:min-h-[108px] sm:p-1.5 sm:pb-7 lg:min-h-[128px] lg:p-2 lg:pb-8"
              style={todayStyle}
            >
              <div
                className={`mb-1 text-xs font-medium sm:text-sm ${isToday(day) ? "font-bold" : ""}`}
                style={{ color: dayNumColor }}
              >
                {format(day, "d")}
              </div>

              {/* 내 근무 */}
              {myDayEvents.slice(0, 1).map((event) => (
                <div
                  key={event.id}
                  className="mb-1 rounded-md px-1 py-1 text-center text-[11px] leading-tight sm:px-1.5 sm:text-[12px] lg:text-[13px]"
                  style={{
                    backgroundColor: "var(--event-bg)",
                    color: "var(--event-text)",
                  }}
                >
                  <div>{formatSeoulTime(event.start_at)}</div>
                  <div>{formatSeoulTime(event.end_at)}</div>
                </div>
              ))}

              {/* 상대방 근무 */}
              {partnerDayEvents.slice(0, 1).map((event) => (
                <div
                  key={event.id}
                  className="relative mb-1 rounded-md px-1 py-1 text-center text-[11px] leading-tight sm:px-1.5 sm:text-[12px] lg:text-[13px]"
                  style={{
                    backgroundColor: "var(--event-bg)",
                    color: "var(--event-text)",
                    opacity: 0.7,
                  }}
                >
                  <span
                    className="absolute -top-1 -left-1 text-[9px] leading-none"
                    style={{ color: "var(--error)" }}
                  >
                    ♥
                  </span>
                  <div>{formatSeoulTime(event.start_at)}</div>
                  <div>{formatSeoulTime(event.end_at)}</div>
                </div>
              ))}

              {holiday && (
                <div
                  className="absolute inset-x-1 bottom-1 rounded-sm px-1.5 py-0.5 text-center text-[10px] font-semibold leading-tight sm:inset-x-1.5 sm:text-[11px] lg:inset-x-2"
                  style={{
                    backgroundColor: "var(--holiday-bg)",
                    color: "var(--holiday-text)",
                  }}
                >
                  {holiday.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function groupEventsByDayKey(events: CalendarEvent[]) {
  const eventsByDayKey = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dayKey = getSeoulDateKey(event.start_at);
    const bucket = eventsByDayKey.get(dayKey);
    if (bucket) {
      bucket.push(event);
    } else {
      eventsByDayKey.set(dayKey, [event]);
    }
  }

  return eventsByDayKey;
}
