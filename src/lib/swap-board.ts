import { SwapEvent, SwapPost } from "@/lib/types";
import {
  formatShiftRange,
  formatShiftStart,
  formatSwapDateShort,
} from "@/lib/time";
import { toWorkTerminology } from "@/lib/terminology";

export const WORK_SHIFT_OPTIONS = [
  "08:00",
  "09:00",
  "09:45",
  "11:00",
  "12:00",
  "13:30",
] as const;

export const WORK_SHIFT_END_BY_START: Record<string, string> = {
  "08:00": "17:00",
  "09:00": "18:00",
  "09:30": "18:30",
  "09:45": "18:45",
  "11:00": "20:00",
  "12:00": "21:00",
  "13:30": "22:30",
};

export type ShiftRequestType = "work" | "off";
export type DatePickerSelectionMode = "all" | "workOnly" | "offOnly";
export type SwapPostMatchTone = "neutral" | "match" | "mismatch";

export interface SwapSummaryRow {
  label: string;
  date: string;
  values: string[];
  secondary?: string;
  tone: "mine" | "target";
  displayMode?: "shiftOptions" | "scheduleFlow";
}

export interface SwapSummaryCardData {
  typeLabel: string;
  mine: SwapSummaryRow;
  target: SwapSummaryRow;
  note?: string;
}

export function formatPreviewTitle(
  swapDate: string | null,
  event: SwapEvent | null,
  title: string
): string {
  const dateLabel = formatSwapDateShort(swapDate);
  const shiftLabel = formatShiftRange(event);
  const cleanTitle = title.trim();
  const head = dateLabel ? `${dateLabel} ${shiftLabel}` : shiftLabel;
  return cleanTitle ? `${head} 로 ${cleanTitle}` : head;
}

export function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function toEventMap(events: SwapEvent[]): Map<string, SwapEvent> {
  const map = new Map<string, SwapEvent>();
  for (const ev of events) {
    const key = new Date(ev.start_at).toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    });
    if (!map.has(key)) map.set(key, ev);
  }
  return map;
}

export function getCalendarRange(baseDate: string) {
  const [y, m] = baseDate.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 0));
  const startDow = (monthStart.getUTCDay() + 6) % 7;
  const endDow = (monthEnd.getUTCDay() + 6) % 7;
  const firstCell = new Date(monthStart);
  firstCell.setUTCDate(monthStart.getUTCDate() - startDow);
  const lastCell = new Date(monthEnd);
  lastCell.setUTCDate(monthEnd.getUTCDate() + (6 - endDow));

  return {
    firstCell,
    lastCell,
    monthStart,
    monthEnd,
    from: isoDate(firstCell),
    to: isoDate(lastCell),
    label: `${y}년 ${m}월`,
  };
}

export function formatDesiredShiftSummary(times: string[]) {
  return WORK_SHIFT_OPTIONS.filter((time) => times.includes(time)).join(", ");
}

export function formatSelectedTeams(teamNames: string[]) {
  if (teamNames.length === 0) return "";
  if (teamNames.length === 1) return teamNames[0];
  return `${teamNames[0]} 외 ${teamNames.length - 1}팀`;
}

export function formatWorkShiftOption(time: string) {
  return WORK_SHIFT_END_BY_START[time]
    ? `${time} – ${WORK_SHIFT_END_BY_START[time]}`
    : time;
}

export function buildWorkRequestTitle(times: string[]) {
  const summary = formatDesiredShiftSummary(times);
  return summary ? `${summary} 근무 원해요` : "근무 교환 원해요";
}

export function buildOffRequestTitle(myOffDate: string) {
  return myOffDate
    ? `${formatSwapDateShort(myOffDate)} 휴무와 교환 원해요`
    : "휴무 교환 원해요";
}

export function buildSwapSummaryFromPost(post: SwapPost): SwapSummaryCardData {
  const structured = parseStructuredSwapBody(post.body);

  if (
    structured.type === "휴무" &&
    structured.myOffDate &&
    structured.desiredOffDate
  ) {
    return {
      typeLabel: "휴무 교환",
      note: structured.note,
      mine: {
        label: "나의 일정",
        date: toCardDate(structured.myOffDate),
        values: ["휴무"],
        tone: "mine",
      },
      target: {
        label: "찾는 일정",
        date: toCardDate(structured.desiredOffDate),
        values: structured.desiredOffShift
          ? [formatDesiredShiftValue(structured.desiredOffShift), "→", "휴무"]
          : ["휴무"],
        tone: "target",
        displayMode: "scheduleFlow",
      },
    };
  }

  const swapDate = post.swap_date ? toCardDate(post.swap_date) : "날짜 미정";
  const desiredShiftSummary = structured.desiredShifts || post.title;
  const desiredShiftValues = sortShiftValues(
    splitShiftValues(toWorkTerminology(desiredShiftSummary))
  ).map(formatDesiredShiftValue);

  return {
    typeLabel: "근무 교환",
    note: structured.note,
    mine: {
      label: "나의 일정",
      date: swapDate,
      values: [formatShiftRange(post.swap_event)],
      tone: "mine",
    },
    target: {
      label: "찾는 일정",
      date: swapDate,
      values: desiredShiftValues,
      tone: "target",
      displayMode: "shiftOptions",
    },
  };
}

export function getSwapPostMatchTone({
  post,
  currentUserId,
  hasCalendarData,
  myEventsByDate,
}: {
  post: Pick<SwapPost, "author_id" | "body" | "title" | "swap_date">;
  currentUserId: string;
  hasCalendarData: boolean;
  myEventsByDate: Map<string, SwapEvent>;
}): SwapPostMatchTone {
  if (
    !hasCalendarData ||
    !post.swap_date ||
    !post.author_id ||
    post.author_id === currentUserId
  ) {
    return "neutral";
  }

  const structured = parseStructuredSwapBody(post.body);
  const myEventOnTargetDate = myEventsByDate.get(post.swap_date) ?? null;

  if (structured.type === "휴무") {
    return myEventOnTargetDate ? "mismatch" : "match";
  }

  const desiredStartTimes = extractDesiredStartTimes(
    structured.desiredShifts || post.title
  );

  if (desiredStartTimes.length === 0) {
    return "neutral";
  }

  const myStartTime = formatShiftStart(myEventOnTargetDate);
  if (!myStartTime) return "mismatch";

  return desiredStartTimes.includes(myStartTime) ? "match" : "mismatch";
}

export function hasAnyDataInWeek(
  date: string,
  eventsByDate: Map<string, SwapEvent>
) {
  const weekStart = getWeekStartIso(date);
  for (let offset = 0; offset < 7; offset += 1) {
    if (eventsByDate.has(addDaysIso(weekStart, offset))) {
      return true;
    }
  }
  return false;
}

export function isSameMondayWeek(a: string, b: string) {
  return getWeekStartIso(a) === getWeekStartIso(b);
}

function getWeekStartIso(date: string) {
  const target = new Date(`${date}T00:00:00Z`);
  const day = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - day);
  return isoDate(target);
}

function addDaysIso(date: string, days: number) {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + days);
  return isoDate(target);
}

function parseStructuredSwapBody(body: string) {
  const rawLines = body.split("\n");
  const lines = rawLines
    .map((line) => line.trim())
    .filter(Boolean);
  const noteLines: string[] = [];
  let reachedNote = false;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      reachedNote = true;
      continue;
    }
    if (reachedNote || !isStructuredSwapLine(trimmed)) {
      noteLines.push(trimmed);
    }
  }

  return {
    type: findStructuredValue(lines, ["근무 유형:", "시프트 유형:"]),
    myOffDate: findStructuredValue(lines, ["내 휴무 날짜:"]),
    desiredOffDate: findStructuredValue(lines, [
      "찾는 휴무 날짜:",
      "원하는 휴무 날짜:",
    ]),
    desiredShifts: findStructuredValue(lines, [
      "찾는 근무:",
      "원하는 근무:",
      "원하는 시프트:",
    ]),
    desiredOffShift: findStructuredValue(lines, [
      "원하는 날짜의 내 근무:",
      "원하는 날짜의 내 시프트:",
    ]),
    note: toWorkTerminology(noteLines.join(" ").trim()) || undefined,
  };
}

function extractDesiredStartTimes(value: string | undefined) {
  if (!value) return [];

  const knownStarts = Object.keys(WORK_SHIFT_END_BY_START).filter((time) =>
    value.includes(time)
  );
  if (knownStarts.length > 0) return knownStarts;

  return [...new Set([...value.matchAll(/(\d{2}:\d{2})/g)].map((match) => match[1]))];
}

function findStructuredValue(lines: string[], prefixes: string[]) {
  for (const line of lines) {
    const prefix = prefixes.find((candidate) => line.startsWith(candidate));
    if (prefix) return line.slice(prefix.length).trim();
  }
}

function isStructuredSwapLine(line: string) {
  return [
    "근무 유형:",
    "시프트 유형:",
    "교환 날짜:",
    "찾는 근무:",
    "원하는 근무:",
    "원하는 시프트:",
    "내 휴무 날짜:",
    "찾는 휴무 날짜:",
    "원하는 휴무 날짜:",
    "원하는 날짜의 내 근무:",
    "원하는 날짜의 내 시프트:",
  ].some((prefix) => line.startsWith(prefix));
}

function toCardDate(value: string | null | undefined) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatSwapDateForCard(formatSwapDateShort(value));
  }

  return formatSwapDateForCard(value);
}

function formatSwapDateForCard(value: string) {
  const match = value.match(/(\d{2})\.\s*(\d{2})\.\s*(\d{2})\s*\((.)\)/);
  if (!match) {
    const compactMatch = value.match(/(\d{1,2})\/(\d{1,2})\s*\((.)\)/);
    if (!compactMatch) return value;
    const [, month, day, weekday] = compactMatch;
    return `${Number(month)}월 ${Number(day)}일 ${weekday}요일`;
  }

  const [, , month, day, weekday] = match;
  return `${Number(month)}월 ${Number(day)}일 ${weekday}요일`;
}

function splitShiftValues(value: string) {
  if (!value) return ["근무 협의"];
  if (value.includes(",")) {
    return value
      .split(",")
      .map(cleanDesiredShiftValue)
      .filter(Boolean);
  }
  return [cleanDesiredShiftValue(value)];
}

function cleanDesiredShiftValue(value: string) {
  return value
    .replace(/\s*근무\s*원해요\s*$/u, "")
    .replace(/\s*교환\s*원해요\s*$/u, "")
    .trim();
}

function sortShiftValues(values: string[]) {
  return [...values].sort(
    (a, b) => getShiftSortMinutes(a) - getShiftSortMinutes(b)
  );
}

function getShiftSortMinutes(value: string) {
  const match = value.match(/(\d{2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatDesiredShiftValue(value: string) {
  const cleanValue = cleanDesiredShiftValue(value);
  const times = [...cleanValue.matchAll(/(\d{2}:\d{2})/g)].map(
    (match) => match[1]
  );
  const [start, end] = times;

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (start && WORK_SHIFT_END_BY_START[start]) {
    return `${start} – ${WORK_SHIFT_END_BY_START[start]}`;
  }

  return cleanValue || "근무 협의";
}
