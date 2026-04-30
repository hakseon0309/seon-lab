export interface KoreanHoliday {
  date: string;
  name: string;
}

const FIXED_PUBLIC_HOLIDAYS = [
  { month: "01", day: "01", name: "신정" },
  { month: "03", day: "01", name: "삼일절" },
  { month: "05", day: "05", name: "어린이날" },
  { month: "06", day: "06", name: "현충일" },
  { month: "08", day: "15", name: "광복절" },
  { month: "10", day: "03", name: "개천절" },
  { month: "10", day: "09", name: "한글날" },
  { month: "12", day: "25", name: "성탄절" },
];

const DATED_PUBLIC_HOLIDAYS: KoreanHoliday[] = [
  { date: "2025-01-27", name: "설날 연휴" },
  { date: "2025-01-28", name: "설날 연휴" },
  { date: "2025-01-29", name: "설날" },
  { date: "2025-01-30", name: "설날 연휴" },
  { date: "2025-03-03", name: "삼일절 대체공휴일" },
  { date: "2025-05-05", name: "어린이날 · 부처님오신날" },
  { date: "2025-05-06", name: "어린이날 대체공휴일" },
  { date: "2025-06-03", name: "대통령 선거일" },
  { date: "2025-10-05", name: "추석 연휴" },
  { date: "2025-10-06", name: "추석" },
  { date: "2025-10-07", name: "추석 연휴" },
  { date: "2025-10-08", name: "추석 대체공휴일" },

  { date: "2026-02-16", name: "설날 연휴" },
  { date: "2026-02-17", name: "설날" },
  { date: "2026-02-18", name: "설날 연휴" },
  { date: "2026-03-02", name: "삼일절 대체공휴일" },
  { date: "2026-05-24", name: "부처님오신날" },
  { date: "2026-05-25", name: "부처님오신날 대체공휴일" },
  { date: "2026-06-03", name: "지방선거일" },
  { date: "2026-08-17", name: "광복절 대체공휴일" },
  { date: "2026-09-24", name: "추석 연휴" },
  { date: "2026-09-25", name: "추석" },
  { date: "2026-09-26", name: "추석 연휴" },
  { date: "2026-10-05", name: "개천절 대체공휴일" },
];

const DATED_HOLIDAY_MAP = new Map(
  DATED_PUBLIC_HOLIDAYS.map((holiday) => [holiday.date, holiday])
);

export function getKoreanHolidayByDateKey(dateKey: string) {
  const datedHoliday = DATED_HOLIDAY_MAP.get(dateKey);
  if (datedHoliday) return datedHoliday;

  const [, month, day] = dateKey.split("-");
  const fixedHoliday = FIXED_PUBLIC_HOLIDAYS.find(
    (holiday) => holiday.month === month && holiday.day === day
  );

  return fixedHoliday
    ? { date: dateKey, name: fixedHoliday.name }
    : null;
}

export function getKoreanHolidayFromList(
  dateKey: string,
  holidays: KoreanHoliday[]
) {
  return holidays.find((holiday) => holiday.date === dateKey) ?? null;
}

export function getFallbackKoreanHolidays(from: string, to: string) {
  const holidays: KoreanHoliday[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  while (cursor <= end) {
    const date = [
      cursor.getUTCFullYear(),
      String(cursor.getUTCMonth() + 1).padStart(2, "0"),
      String(cursor.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const holiday = getKoreanHolidayByDateKey(date);
    if (holiday) holidays.push(holiday);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return holidays;
}
