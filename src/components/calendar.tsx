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
import Link from "next/link";
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
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface CalendarProps {
  events: CalendarEvent[];
  partnerEvents?: CalendarEvent[];
  calendarWindow?: CalendarWindow;
  holidays?: KoreanHoliday[];
  showSetupHint?: boolean;
}

const EDGE_POPOVER_TAIL_OFFSET = 14;
const HOLIDAY_POPOVER_TAIL_HEIGHT = 6;
type HolidayPopoverAlign = "left" | "center" | "right";

export default function Calendar({
  events,
  partnerEvents = [],
  calendarWindow,
  holidays = [],
  showSetupHint = false,
}: CalendarProps) {
  const resolvedWindow = useMemo(
    () => calendarWindow ?? createThreeMonthWindow(new Date()),
    [calendarWindow]
  );
  const [currentDate, setCurrentDate] = useState(() =>
    parseMonthKey(resolvedWindow.initialMonth)
  );
  const [activeHoliday, setActiveHoliday] = useState<{
    dayKey: string;
    monthKey: string;
    name: string;
    x: number;
    y: number;
    align: HolidayPopoverAlign;
  } | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const previousDisabled = isWindowStartMonth(currentDate, resolvedWindow);
  const nextDisabled = isWindowEndMonth(currentDate, resolvedWindow);
  const currentMonthKey = format(currentDate, "yyyy-MM");
  const activeHolidayForCurrentMonth =
    activeHoliday?.monthKey === currentMonthKey ? activeHoliday : null;
  const myEventsByDayKey = useMemo(() => groupEventsByDayKey(events), [events]);
  const partnerEventsByDayKey = useMemo(
    () => groupEventsByDayKey(partnerEvents),
    [partnerEvents]
  );

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  useEffect(() => {
    if (!activeHolidayForCurrentMonth) return;

    const close = () => setActiveHoliday(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("scroll", close, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeHolidayForCurrentMonth]);

  function showHolidayPopover(
    dayKey: string,
    name: string,
    target: HTMLElement,
    day: Date
  ) {
    const cell = target.closest("[data-calendar-cell='true']") as
      | HTMLElement
      | null;
    const rect = (cell ?? target).getBoundingClientRect();
    const anchorX = rect.left + rect.width / 2;

    setActiveHoliday({
      dayKey,
      monthKey: currentMonthKey,
      name,
      x: anchorX,
      y: rect.top - HOLIDAY_POPOVER_TAIL_HEIGHT,
      align: getHolidayPopoverAlign(day),
    });
  }

  return (
    <section className="w-full min-w-0">
      <CalendarMonthNavigator
        currentDate={currentDate}
        previousDisabled={previousDisabled}
        nextDisabled={nextDisabled}
        sticky={false}
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

      <div className="relative">
        <div
          className={`grid w-full min-w-0 grid-cols-7 gap-px overflow-hidden border-y transition-opacity lg:rounded-lg lg:border ${
            showSetupHint ? "blur-[1px] opacity-40" : ""
          }`}
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
            const dayNumColor = holiday
              ? "var(--holiday-bg)"
              : weekend
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
                data-calendar-cell="true"
                className="relative min-h-[82px] overflow-hidden p-1 pb-6 sm:min-h-[108px] sm:p-1.5 sm:pb-7 lg:min-h-[128px] lg:p-2 lg:pb-8"
                style={todayStyle}
              >
                {holiday && (
                  <button
                    type="button"
                    className="absolute inset-0 z-10 border-0 bg-transparent p-0"
                    aria-label={`${format(day, "M월 d일")} ${holiday.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      showHolidayPopover(
                        dayKey,
                        holiday.name,
                        event.currentTarget,
                        day
                      );
                    }}
                  />
                )}
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

              </div>
            );
          })}
        </div>
        {showSetupHint && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
            <div
              className="w-full max-w-[320px] rounded-lg border p-4 text-center text-sm shadow-xl"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-secondary)",
              }}
            >
              <p className="leading-6">
                캘린더 구독 URL을 등록하면
                <br />
                근무 일정이 자동으로 입력됩니다.
              </p>
              <Link
                href="/settings"
                className="interactive-press mt-4 inline-flex rounded-lg px-3 py-2 text-xs font-medium"
                style={{
                  backgroundColor: "var(--button-surface)",
                  color: "var(--text-primary)",
                }}
              >
                설정에서 등록하기
              </Link>
            </div>
          </div>
        )}
      </div>
      {activeHolidayForCurrentMonth && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed w-max max-w-[calc(100vw-1rem)] whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold shadow-xl"
              role="tooltip"
              style={{
                left:
                  activeHolidayForCurrentMonth.align === "left"
                    ? activeHolidayForCurrentMonth.x - EDGE_POPOVER_TAIL_OFFSET
                    : activeHolidayForCurrentMonth.align === "right"
                    ? activeHolidayForCurrentMonth.x + EDGE_POPOVER_TAIL_OFFSET
                    : activeHolidayForCurrentMonth.x,
                top: activeHolidayForCurrentMonth.y,
                zIndex: 1600,
                transform:
                  activeHolidayForCurrentMonth.align === "left"
                    ? "translate(0, -100%)"
                    : activeHolidayForCurrentMonth.align === "right"
                    ? "translate(-100%, -100%)"
                    : "translate(-50%, -100%)",
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
            >
              {activeHolidayForCurrentMonth.name}
              <HolidayPopoverTail align={activeHolidayForCurrentMonth.align} />
            </div>,
            document.body
          )
        : null}
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

function getHolidayPopoverAlign(day: Date): HolidayPopoverAlign {
  const dayOfWeek = day.getDay();
  if (dayOfWeek === 1) return "left";
  if (dayOfWeek === 0) return "right";
  return "center";
}

function HolidayPopoverTail({ align }: { align: HolidayPopoverAlign }) {
  const horizontalPosition =
    align === "left"
      ? `${EDGE_POPOVER_TAIL_OFFSET}px`
      : align === "right"
        ? `calc(100% - ${EDGE_POPOVER_TAIL_OFFSET}px)`
        : "50%";

  return (
    <>
      <span
        className="absolute top-full h-0 w-0 -translate-x-1/2"
        style={{
          left: horizontalPosition,
          borderLeft: `${HOLIDAY_POPOVER_TAIL_HEIGHT}px solid transparent`,
          borderRight: `${HOLIDAY_POPOVER_TAIL_HEIGHT}px solid transparent`,
          borderTop: `${HOLIDAY_POPOVER_TAIL_HEIGHT}px solid var(--border-light)`,
        }}
        aria-hidden="true"
      />
      <span
        className="absolute h-0 w-0 -translate-x-1/2"
        style={{
          left: horizontalPosition,
          top: "calc(100% - 1px)",
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "5px solid var(--bg-card)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
