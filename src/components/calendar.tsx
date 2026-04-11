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
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
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

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          &larr;
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, "yyyy년 M월", { locale: ko })}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] bg-white p-1.5 ${
                !isSameMonth(day, currentDate) ? "opacity-40" : ""
              }`}
            >
              <div
                className={`mb-1 text-xs font-medium ${
                  isToday(day)
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white"
                    : "text-gray-700"
                }`}
              >
                {format(day, "d")}
              </div>
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="mb-0.5 truncate rounded bg-blue-50 px-1 py-0.5 text-[10px] leading-tight text-blue-700"
                  title={`${event.summary}\n${format(new Date(event.start_at), "HH:mm")} - ${format(new Date(event.end_at), "HH:mm")}`}
                >
                  {event.summary}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[10px] text-gray-400">
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
