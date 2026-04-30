"use client";

import { memo, Fragment, useEffect, useMemo, useRef, useState } from "react";
import AvatarImage from "@/components/avatar-image";
import { formatSeoulTime, getSeoulDateKey } from "@/lib/time";
import { CalendarEvent, UserProfile } from "@/lib/types";
import { weekendOverlay, cellBackground } from "@/lib/calendar-style";
import {
  getKoreanHolidayByDateKey,
  getKoreanHolidayFromList,
} from "@/lib/korean-holidays";
import type { KoreanHoliday } from "@/lib/korean-holidays";
import { createPortal } from "react-dom";
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
  holidays?: KoreanHoliday[];
  onMemberClick?: (userId: string) => void;
}

const EDGE_POPOVER_TAIL_OFFSET = 14;
const HOLIDAY_POPOVER_TAIL_HEIGHT = 6;
type HolidayPopoverAlign = "left" | "center" | "right";

function TeamCalendar({
  members,
  currentDate,
  holidays = [],
  onMemberClick,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const todayWeekRef = useRef<HTMLTableRowElement | null>(null);
  const [activeHoliday, setActiveHoliday] = useState<{
    dayKey: string;
    monthKey: string;
    name: string;
    x: number;
    y: number;
    align: HolidayPopoverAlign;
  } | null>(null);
  const calendarSlotHeightClass = "h-[40px] lg:h-[46px]";
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const currentMonthKey = format(currentDate, "yyyy-MM");
  const activeHolidayForCurrentMonth =
    activeHoliday?.monthKey === currentMonthKey ? activeHoliday : null;
  const weekStarts = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 1 }
  );
  const todayKey = getSeoulDateKey(today);
  const preparedMembers = useMemo(() => {
    return members
      .map((member) => {
        const eventsByDayKey = new Map<string, CalendarEvent[]>();
        let todayEarliestStart: number | null = null;

        for (const event of member.events) {
          const dayKey = getSeoulDateKey(event.start_at);
          const bucket = eventsByDayKey.get(dayKey);
          if (bucket) {
            bucket.push(event);
          } else {
            eventsByDayKey.set(dayKey, [event]);
          }

          if (dayKey === todayKey) {
            const start = new Date(event.start_at).getTime();
            if (todayEarliestStart === null || start < todayEarliestStart) {
              todayEarliestStart = start;
            }
          }
        }

        return {
          ...member,
          eventsByDayKey,
          todayEarliestStart,
        };
      })
      .sort((a, b) => {
        const aStart = a.todayEarliestStart;
        const bStart = b.todayEarliestStart;

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

  useEffect(() => {
    if (!activeHolidayForCurrentMonth) return;

    const close = () => setActiveHoliday(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeHolidayForCurrentMonth]);

  function showHolidayPopover(
    dayKey: string,
    name: string,
    target: HTMLElement,
    day: Date
  ) {
    const rect = (target.closest("td") ?? target).getBoundingClientRect();
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
                    className={`sticky left-0 z-10 w-20 lg:w-32 ${calendarSlotHeightClass}`}
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderRight: "1px solid var(--border-light)",
                      borderTop: weekIdx > 0 ? "1px solid var(--border)" : undefined,
                    }}
                  />
                  {weekDays.map((day) => {
                    const dayKey = getSeoulDateKey(day);
                    const holiday =
                      getKoreanHolidayFromList(dayKey, holidays) ??
                      getKoreanHolidayByDateKey(dayKey);
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
                        className="relative px-0.5 py-0.5 text-center text-xs font-medium lg:px-2 lg:py-1"
                        style={{
                          color: headerColor,
                          ...headerBg,
                          borderTop: weekIdx > 0 ? "1px solid var(--border)" : undefined,
                          borderLeft: "1px solid var(--border-light)",
                          ...(isToday && { outline: "1.5px solid var(--today-border)", outlineOffset: "-1.5px", zIndex: 1 }),
                        }}
                      >
                        {holiday ? (
                          <button
                            type="button"
                            className={`flex w-full flex-col items-center justify-center ${calendarSlotHeightClass}`}
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
                          >
                            <HeaderDateText day={day} isToday={isToday} />
                          </button>
                        ) : (
                          <div
                            className={`flex flex-col items-center justify-center ${calendarSlotHeightClass}`}
                          >
                            <HeaderDateText day={day} isToday={isToday} />
                          </div>
                        )}
                        {holiday && (
                          <span
                            className="pointer-events-none absolute inset-x-1 bottom-1 h-1 rounded-full"
                            style={{ backgroundColor: "var(--holiday-bg)" }}
                            aria-hidden="true"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>

                {preparedMembers.map(({ profile, eventsByDayKey }) => (
                  <tr key={`${weekStart.toISOString()}-${profile.id}`}>
                    <td
                      className="sticky left-0 z-10 w-20 lg:w-32 p-0 text-xs lg:text-sm font-medium"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderRight: "1px solid var(--border-light)",
                        borderTop: "1px solid var(--border-light)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onMemberClick?.(profile.id)}
                        disabled={!onMemberClick}
                        className={`interactive-press flex w-full min-w-0 items-center gap-1.5 px-1 py-0.5 text-left disabled:opacity-100 lg:px-2 lg:py-1 ${calendarSlotHeightClass}`}
                      >
                        <AvatarImage
                          src={profile.avatar_url}
                          name={profile.display_name}
                          sizeClass="h-6 w-6 lg:h-7 lg:w-7"
                          textClass="text-[10px]"
                        />
                        <span className="block min-w-0 truncate">
                          {profile.display_name}
                        </span>
                      </button>
                    </td>
                    {weekDays.map((day) => {
                      const dayKey = getSeoulDateKey(day);
                      const dayEvents = eventsByDayKey.get(dayKey) ?? [];
                      const inMonth = isSameMonth(day, currentDate);
                      const bg = cellBackground(day, inMonth);
                      return (
                        <td
                          key={day.toISOString()}
                          className="px-0.5 py-0.5 text-center align-top lg:px-1 lg:py-1"
                          style={{
                            ...bg,
                            borderTop: "1px solid var(--border-light)",
                            borderLeft: "1px solid var(--border-light)",
                          }}
                        >
                          <div
                            className={`flex flex-col ${calendarSlotHeightClass}`}
                          >
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="flex h-full flex-col justify-center rounded-md px-0.5 py-0 text-[11px] leading-tight last:mb-0 lg:px-1 lg:py-0.5 lg:text-[12px]"
                                style={{
                                  backgroundColor: "var(--event-bg)",
                                  color: "var(--event-sub)",
                                }}
                              >
                                <div>{formatSeoulTime(event.start_at)}</div>
                                <div>{formatSeoulTime(event.end_at)}</div>
                              </div>
                            ))}
                          </div>
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
    </div>
  );
}

export default memo(TeamCalendar);

function HeaderDateText({ day, isToday }: { day: Date; isToday: boolean }) {
  return (
    <>
      <div className="text-[10px]" style={{ color: "inherit" }}>
        {format(day, "EEE", { locale: ko })}
      </div>
      <span
        className={`inline-flex items-center justify-center text-[11px] ${isToday ? "font-bold" : ""}`}
      >
        {format(day, "d")}
      </span>
    </>
  );
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
