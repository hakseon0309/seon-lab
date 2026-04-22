import ICAL from "ical.js";

export interface ParsedEvent {
  uid: string;
  summary: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
}

export type IcsErrorCode =
  | "invalid_url"
  | "fetch_failed"
  | "fetch_timeout"
  | "parse_failed";

export class IcsError extends Error {
  code: IcsErrorCode;
  status?: number;
  constructor(code: IcsErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "IcsError";
  }
}

export function icsErrorToKorean(code: IcsErrorCode): string {
  switch (code) {
    case "invalid_url":
      return "캘린더 URL 형식이 올바르지 않아요";
    case "fetch_timeout":
      return "캘린더 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요";
    case "fetch_failed":
      return "캘린더에 접근할 수 없어요. URL이 맞는지 확인해주세요";
    case "parse_failed":
      return "캘린더 데이터를 읽을 수 없어요. URL이 iCalendar(.ics) 형식인지 확인해주세요";
  }
}

/**
 * ical.js에 Asia/Seoul(KST, UTC+9) 타임존을 미리 등록한다.
 * 이렇게 하면 DTSTART;TZID=Asia/Seoul 이 포함된 ICS를
 * VTIMEZONE 컴포넌트 유무와 무관하게 항상 올바르게 변환한다.
 */
function registerSeoulTimezone() {
  if (ICAL.TimezoneService.has("Asia/Seoul")) return;

  const tzComp = new ICAL.Component(
    ICAL.parse(
      [
        "BEGIN:VTIMEZONE",
        "TZID:Asia/Seoul",
        "BEGIN:STANDARD",
        "TZOFFSETFROM:+0900",
        "TZOFFSETTO:+0900",
        "TZNAME:KST",
        "DTSTART:19700101T000000",
        "END:STANDARD",
        "END:VTIMEZONE",
      ].join("\r\n")
    )
  );
  ICAL.TimezoneService.register(new ICAL.Timezone(tzComp));
}

export function parseICS(icsData: string): ParsedEvent[] {
  registerSeoulTimezone();

  try {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    return vevents.map((vevent) => {
      const event = new ICAL.Event(vevent);
      return {
        uid: event.uid,
        summary: event.summary || "",
        startAt: event.startDate.toJSDate(),
        endAt: event.endDate.toJSDate(),
        location: event.location || null,
      };
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new IcsError("parse_failed", `parse: ${msg}`);
  }
}

const FETCH_TIMEOUT_MS = 10_000;

export async function fetchAndParseICS(url: string): Promise<ParsedEvent[]> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new IcsError("invalid_url", `invalid url: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new IcsError("invalid_url", `unsupported protocol: ${parsed.protocol}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new IcsError("fetch_timeout", `timeout after ${FETCH_TIMEOUT_MS}ms`);
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new IcsError("fetch_failed", `fetch: ${msg}`);
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new IcsError(
      "fetch_failed",
      `fetch status ${response.status}`,
      response.status
    );
  }
  const text = await response.text();
  return parseICS(text);
}
