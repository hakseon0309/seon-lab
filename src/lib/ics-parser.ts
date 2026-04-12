import ICAL from "ical.js";

export interface ParsedEvent {
  uid: string;
  summary: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
}

export function parseICS(icsData: string): ParsedEvent[] {
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
