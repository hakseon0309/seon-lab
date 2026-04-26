const SEOUL_TIME_ZONE = "Asia/Seoul";
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

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

export function getSeoulIsoDayRange(date: string) {
  const startISO = new Date(`${date}T00:00:00+09:00`).toISOString();
  const endISO = new Date(
    new Date(`${date}T00:00:00+09:00`).getTime() + DAY_IN_MILLISECONDS
  ).toISOString();

  return { startISO, endISO };
}

export function getSeoulIsoInclusiveDateRange(from: string, to: string) {
  const startISO = new Date(`${from}T00:00:00+09:00`).toISOString();
  const endISO = new Date(
    new Date(`${to}T00:00:00+09:00`).getTime() + DAY_IN_MILLISECONDS
  ).toISOString();

  return { startISO, endISO };
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

/**
 * 시프트 교환 게시판용 짧은 날짜 포맷.
 * 예) "26. 04. 25 (토)" — YY. MM. DD (요일), 달력 아이콘은 사용하지 않음.
 */
export function formatSwapDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    weekday: "short",
  }).format(new Date(`${iso}T00:00:00+09:00`));
  return `${y.slice(2)}. ${m}. ${d} (${weekday})`;
}

/**
 * 시프트 시작~종료 시각 포맷. 예) "09:45 – 18:45".
 * 이벤트가 없으면 "휴무".
 */
export function formatShiftRange(event: {
  start_at: string;
  end_at: string;
} | null | undefined): string {
  if (!event) return "휴무";
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(new Date(event.start_at))} – ${fmt.format(new Date(event.end_at))}`;
}

/**
 * 시프트 시작 시각만. 예) "09:45". 미니 달력 셀용.
 */
export function formatShiftStart(
  event: { start_at: string } | null | undefined
): string {
  if (!event) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(event.start_at));
}

/**
 * 작성 일자 표시 포맷.
 * - 1일 이내: "방금 전" / "n분 전" / "n시간 전" (formatRelativeTime 규칙)
 * - 1 ~ 30일 전: "n일 전"
 * - 30일 초과: "YYYY.MM.DD" (시간 없음, 서울 기준)
 */
export function formatPostedAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 30) {
    return formatRelativeTime(date);
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}.${m}.${d}`;
}
