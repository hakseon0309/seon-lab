import {
  addMonths,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { getSeoulIsoInclusiveDateRange } from "@/lib/time";

export interface CalendarWindow {
  initialMonth: string;
  minMonth: string;
  maxMonth: string;
}

export function monthKey(date: Date) {
  return format(startOfMonth(date), "yyyy-MM");
}

export function parseMonthKey(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function createThreeMonthWindow(baseDate: Date): CalendarWindow {
  const initialMonth = startOfMonth(baseDate);

  return {
    initialMonth: monthKey(initialMonth),
    minMonth: monthKey(subMonths(initialMonth, 1)),
    maxMonth: monthKey(addMonths(initialMonth, 1)),
  };
}

export function getCalendarWindowEventRange(window: CalendarWindow) {
  const start = parseMonthKey(window.minMonth);
  const end = endOfMonth(parseMonthKey(window.maxMonth));
  const from = format(start, "yyyy-MM-dd");
  const to = format(end, "yyyy-MM-dd");
  const { startISO, endISO } = getSeoulIsoInclusiveDateRange(from, to);

  return { from, to, startISO, endISO };
}

export function isWindowStartMonth(date: Date, window: CalendarWindow) {
  return isSameMonth(date, parseMonthKey(window.minMonth));
}

export function isWindowEndMonth(date: Date, window: CalendarWindow) {
  return isSameMonth(date, parseMonthKey(window.maxMonth));
}
