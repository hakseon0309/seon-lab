"use client";

import {
  CalendarWindow,
  createThreeMonthWindow,
  isWindowEndMonth,
  isWindowStartMonth,
  parseMonthKey,
} from "@/lib/calendar-window";
import Modal from "@/components/modal";
import {
  formatShiftStart,
} from "@/lib/time";
import { SwapEvent } from "@/lib/types";
import {
  DatePickerSelectionMode,
  getCalendarRange,
  hasAnyDataInWeek,
  isSameMondayWeek,
  isoDate,
} from "@/lib/swap-board";
import { useMemo, useState } from "react";

export interface SwapDatePickerModalProps {
  title?: string;
  initialDate: string;
  selectedDate?: string;
  minDate: string;
  selectionMode?: DatePickerSelectionMode;
  sameWeekAnchorDate?: string;
  calendarWindow?: CalendarWindow;
  eventsByDate?: Map<string, SwapEvent>;
  onCancel: () => void;
  onPick: (date: string, event: SwapEvent | null) => void;
}

export default function SwapDatePickerModal({
  title = "날짜 선택",
  initialDate,
  selectedDate,
  minDate,
  selectionMode = "all",
  sameWeekAnchorDate,
  calendarWindow,
  eventsByDate,
  onCancel,
  onPick,
}: SwapDatePickerModalProps) {
  const resolvedWindow = useMemo(
    () =>
      calendarWindow ??
      createThreeMonthWindow(new Date(`${minDate}T00:00:00+09:00`)),
    [calendarWindow, minDate]
  );
  const [cursor, setCursor] = useState(() => {
    const [year, month] = initialDate.split("-");
    return `${year}-${month}-01`;
  });

  const { firstCell, lastCell, monthStart, monthEnd, label } = useMemo(
    () => getCalendarRange(cursor),
    [cursor]
  );
  const visibleEventsByDate = eventsByDate ?? new Map<string, SwapEvent>();
  const cursorMonthDate = parseMonthKey(cursor.slice(0, 7));
  const previousDisabled = isWindowStartMonth(cursorMonthDate, resolvedWindow);
  const nextDisabled = isWindowEndMonth(cursorMonthDate, resolvedWindow);

  const cells: string[] = [];
  for (
    let day = new Date(firstCell);
    day <= lastCell;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    cells.push(isoDate(day));
  }

  function moveMonth(offset: number) {
    if ((offset < 0 && previousDisabled) || (offset > 0 && nextDisabled)) {
      return;
    }
    const [year, month] = cursor.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + offset, 1));
    setCursor(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-01`
    );
  }

  const monthStartIso = isoDate(monthStart);
  const monthEndIso = isoDate(monthEnd);

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            disabled={previousDisabled}
            aria-label="이전 달"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium disabled:opacity-40"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--button-surface)",
            }}
          >
            ‹
          </button>
          <span
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            disabled={nextDisabled}
            aria-label="다음 달"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium disabled:opacity-40"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--button-surface)",
            }}
          >
            ›
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-1 text-center text-[10px]"
          style={{ color: "var(--text-muted)" }}
        >
          {["월", "화", "수", "목", "금", "토", "일"].map((weekday) => (
            <div key={weekday} className="py-1">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date) => {
            const inMonth = date >= monthStartIso && date <= monthEndIso;
            const event = visibleEventsByDate.get(date);
            const hasWork = Boolean(event);
            const weekHasAnyData = hasAnyDataInWeek(date, visibleEventsByDate);
            const matchesMode =
              selectionMode === "all" ||
              (selectionMode === "workOnly" && hasWork) ||
              (selectionMode === "offOnly" && !hasWork && weekHasAnyData);
            const matchesWeek =
              !sameWeekAnchorDate ||
              isSameMondayWeek(date, sameWeekAnchorDate);
            const disabled = date < minDate || !matchesMode || !matchesWeek;
            const selected = date === selectedDate;
            const dayNumber = Number(date.split("-")[2]);

            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                onClick={() => onPick(date, event ?? null)}
                className="interactive-press flex aspect-square flex-col items-center justify-center rounded-md border text-xs disabled:opacity-30"
                style={{
                  borderColor: selected
                    ? "var(--primary)"
                    : "var(--border-light)",
                  backgroundColor: inMonth
                    ? selected
                      ? "var(--primary-light)"
                      : "var(--bg-card)"
                    : "var(--bg-surface)",
                  color: inMonth
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                <span className="text-xs font-medium">{dayNumber}</span>
                {event && (
                  <span
                    className="mt-0.5 text-[9px] leading-tight"
                    style={{ color: "var(--event-text)" }}
                  >
                    {formatShiftStart(event)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p
          className="text-center text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          {sameWeekAnchorDate && selectionMode === "workOnly"
            ? "선택한 날짜와 같은 주차의 근무일만 선택할 수 있습니다."
            : sameWeekAnchorDate
              ? "선택한 날짜와 같은 주차만 선택할 수 있습니다."
              : selectionMode === "offOnly"
            ? "휴무인 날만 선택할 수 있습니다."
            : selectionMode === "workOnly"
              ? "근무가 있는 날만 선택할 수 있습니다."
              : "칸의 시각은 내 근무 시작 시각입니다."}
        </p>
      </div>
    </Modal>
  );
}
