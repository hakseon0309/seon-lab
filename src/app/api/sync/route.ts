import { createClient } from "@/lib/supabase/server";
import { syncEventsSnapshot } from "@/lib/event-sync";
import { fetchAndParseICS } from "@/lib/ics-parser";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check cooldown
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("ics_url, last_synced")
    .eq("id", user.id)
    .single();

  if (!profile?.ics_url) {
    return NextResponse.json({ error: "No calendar URL set" }, { status: 400 });
  }

  if (profile.last_synced) {
    const lastSynced = new Date(profile.last_synced);
    const cooldown = 30 * 60 * 1000; // 30 minutes
    if (Date.now() - lastSynced.getTime() < cooldown) {
      const remaining = Math.ceil(
        (cooldown - (Date.now() - lastSynced.getTime())) / 60000
      );
      return NextResponse.json(
        { error: "Cooldown active", remaining_minutes: remaining },
        { status: 429 }
      );
    }
  }

  try {
    const events = await fetchAndParseICS(profile.ics_url);
    await syncEventsSnapshot(supabase, user.id, events);

    // Update last_synced
    await supabase
      .from("user_profiles")
      .update({ last_synced: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ synced: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
