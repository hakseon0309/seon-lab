import { ParsedEvent } from "@/lib/ics-parser";

type EventRow = {
  uid: string;
};

type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: EventRow[] | null; error: { message: string } | null }>;
    };
    delete: () => {
      eq: (column: string, value: string) => {
        in: (column: string, values: string[]) => Promise<{ error: { message: string } | null }>;
      };
    };
    upsert: (
      values:
        | {
            user_id: string;
            uid: string;
            summary: string;
            start_at: string;
            end_at: string;
            location: string | null;
          }
        | {
            user_id: string;
            uid: string;
            summary: string;
            start_at: string;
            end_at: string;
            location: string | null;
          }[],
      options: { onConflict: string }
    ) => Promise<{ error: { message: string } | null }>;
  };
};

export async function syncEventsSnapshot(
  supabase: SupabaseLikeClient,
  userId: string,
  events: ParsedEvent[]
) {
  const { data: existingEvents, error: existingError } = await supabase
    .from("events")
    .select("uid")
    .eq("user_id", userId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const nextUids = new Set(events.map((event) => event.uid));
  const staleUids =
    existingEvents?.filter((event) => !nextUids.has(event.uid)).map((event) => event.uid) ?? [];

  if (staleUids.length > 0) {
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("user_id", userId)
      .in("uid", staleUids);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  if (events.length === 0) {
    return;
  }

  const rows = events.map((event) => ({
    user_id: userId,
    uid: event.uid,
    summary: event.summary,
    start_at: event.startAt.toISOString(),
    end_at: event.endAt.toISOString(),
    location: event.location,
  }));

  const { error: upsertError } = await supabase
    .from("events")
    .upsert(rows, { onConflict: "user_id,uid" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}
