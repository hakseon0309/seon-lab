"use client";

import { CalendarEvent } from "@/lib/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

interface CalendarProps {
  events: CalendarEvent[];
}

export default function Calendar({ events }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getEventsForDay(day: Date) {
    return events.filter((event) => {
      const eventStart = new Date(event.start_at);
      return isSameDay(eventStart, day);
    });
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

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-4 lg:px-0">
        <button
          onClick={prevMonth}
          className="rounded-md px-3 py-1.5 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          &larr;
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
          &rarr;
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-px overflow-hidden lg:rounded-lg border-y lg:border"
        style={{
          borderColor: "var(--border-light)",
          backgroundColor: "var(--border-light)",
        }}
      >
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-1.5 lg:py-2 text-center text-xs font-medium"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-muted)",
            }}
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className="min-h-[56px] lg:min-h-[80px] p-0.5 lg:p-1.5"
              style={{
                backgroundColor: !isSameMonth(day, currentDate)
                  ? "var(--bg-out-of-month)"
                  : "var(--bg-card)",
              }}
            >
              <div
                className="mb-1 flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full"
                style={
                  isToday(day)
                    ? {
                        backgroundColor: "var(--today-bg)",
                        color: "var(--today-text)",
                      }
                    : !isSameMonth(day, currentDate)
                      ? { color: "var(--text-out-of-month)" }
                      : { color: "var(--text-secondary)" }
                }
              >
                {format(day, "d")}
              </div>
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="mb-0.5 rounded px-1 py-0.5 text-[10px] leading-tight text-center"
                  style={{
                    backgroundColor: "var(--event-bg)",
                    color: "var(--event-text)",
                  }}
                >
                  <div>{format(new Date(event.start_at), "HH:mm")}</div>
                  <div>{format(new Date(event.end_at), "HH:mm")}</div>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  +{dayEvents.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
