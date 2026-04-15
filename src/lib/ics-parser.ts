import ICAL from "ical.js";

export interface ParsedEvent {
  uid: string;
  summary: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
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
}

export async function fetchAndParseICS(url: string): Promise<ParsedEvent[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ICS: ${response.status}`);
  }
  const text = await response.text();
  return parseICS(text);
}
