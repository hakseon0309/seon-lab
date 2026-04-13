const SEOUL_TIME_ZONE = "Asia/Seoul";

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return { year, month, day };
}

export function getSeoulDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const { year, month, day } = getDateParts(date);
  return `${year}-${month}-${day}`;
}

export function formatSeoulTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatRelativeTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// 트레이더스 하남점: 매월 둘째·넷째 수요일 휴무
// 1st Wed: day 1-7, 2nd Wed: day 8-14, 3rd Wed: day 15-21, 4th Wed: day 22-28
export function isTradersHoliday(date: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    weekday: "short",
    day: "numeric",
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === "weekday")?.value; // "Wed"
  const day = Number(parts.find((p) => p.type === "day")?.value);

  if (weekday !== "Wed") return false;
  return (day >= 8 && day <= 14) || (day >= 22 && day <= 28);
}

export function formatSeoulDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
