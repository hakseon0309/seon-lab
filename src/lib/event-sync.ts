import { ParsedEvent } from "@/lib/ics-parser";

type EventRow = {
  uid: string;
};

type SupabaseLikeClient = {
  from: (table: string) => any;
};

type ExistingEventsResult = {
  data: EventRow[] | null;
  error: { message: string } | null;
};

type MutationResult = {
  error: { message: string } | null;
};

function deduplicateByDate(events: ParsedEvent[]): ParsedEvent[] {
  const byDate = new Map<string, ParsedEvent>();
  for (const event of events) {
    const dateKey = event.startAt.toISOString().slice(0, 10); // "YYYY-MM-DD"
    byDate.set(dateKey, event); // 같은 날짜면 뒤에 오는 것으로 덮어씀
  }
  return Array.from(byDate.values());
}

export async function syncEventsSnapshot(
  supabase: SupabaseLikeClient,
  userId: string,
  events: ParsedEvent[]
) {
  const deduplicatedEvents = deduplicateByDate(events);

  const { data: existingEvents, error: existingError } = (await supabase
    .from("events")
    .select("uid")
    .eq("user_id", userId)) as ExistingEventsResult;

  if (existingError) {
    throw new Error(existingError.message);
  }

  const nextUids = new Set(deduplicatedEvents.map((event) => event.uid));
  const staleUids =
    existingEvents?.filter((event) => !nextUids.has(event.uid)).map((event) => event.uid) ?? [];

  if (staleUids.length > 0) {
    const { error: deleteError } = (await supabase
      .from("events")
      .delete()
      .eq("user_id", userId)
      .in("uid", staleUids)) as MutationResult;

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  if (deduplicatedEvents.length === 0) {
    return;
  }

  const rows = deduplicatedEvents.map((event) => ({
    user_id: userId,
    uid: event.uid,
    summary: event.summary,
    start_at: event.startAt.toISOString(),
    end_at: event.endAt.toISOString(),
    location: event.location,
  }));

  const { error: upsertError } = (await supabase
    .from("events")
    .upsert(rows, { onConflict: "user_id,uid" })) as MutationResult;

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}
