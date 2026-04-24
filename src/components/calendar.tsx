"use client";

import { CalendarEvent } from "@/lib/types";
import { formatSeoulTime, getSeoulDateKey } from "@/lib/time";
import { weekendOverlay, cellBackground } from "@/lib/calendar-style";
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
import { ko } from "date-fns/locale";
import { useState } from "react";

interface CalendarProps {
  events: CalendarEvent[];
  partnerEvents?: CalendarEvent[];
}

export default function Calendar({ events, partnerEvents = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getMyEventsForDay(day: Date) {
    const dayKey = getSeoulDateKey(day);
    return events.filter((e) => getSeoulDateKey(e.start_at) === dayKey);
  }

  function getPartnerEventsForDay(day: Date) {
    const dayKey = getSeoulDateKey(day);
    return partnerEvents.filter((e) => getSeoulDateKey(e.start_at) === dayKey);
  }

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <section className="w-full min-w-0">
      <div
        className="sticky top-28 z-20 flex items-center justify-between px-4 py-3 lg:top-0 lg:px-0"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          aria-label="이전 달"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium"
          style={{ color: "var(--text-primary)", backgroundColor: "var(--button-surface)" }}
        >
          ‹
        </button>

        <h2
          className="text-xl font-semibold sm:text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          {format(currentDate, "yyyy년 M월", { locale: ko })}
        </h2>

        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          aria-label="다음 달"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium"
          style={{ color: "var(--text-primary)", backgroundColor: "var(--button-surface)" }}
        >
          ›
        </button>
      </div>

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
          const myDayEvents = getMyEventsForDay(day);
          const partnerDayEvents = getPartnerEventsForDay(day);
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
              className="min-h-[82px] p-1 sm:min-h-[108px] sm:p-1.5 lg:min-h-[128px] lg:p-2"
              style={todayStyle}
            >
              <div
                className={`mb-1 text-xs font-medium sm:text-sm ${isToday(day) ? "font-bold" : ""}`}
                style={{ color: dayNumColor }}
              >
                {format(day, "d")}
              </div>

              {/* 내 시프트 */}
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

              {/* 상대방 시프트 */}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
