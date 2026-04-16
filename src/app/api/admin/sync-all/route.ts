import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { fetchAndParseICS } from "@/lib/ics-parser";
import { syncEventsSnapshot } from "@/lib/event-sync";

export async function POST() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const admin = createAdminClient();
  const { data: profiles, error: profilesError } = await admin
    .from("user_profiles")
    .select("id, ics_url")
    .not("ics_url", "is", null);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ synced: 0, failed: 0, total: 0 });
  }

  let synced = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      const events = await fetchAndParseICS(profile.ics_url!);
      await syncEventsSnapshot(admin, profile.id, events);

      await admin
        .from("user_profiles")
        .update({ last_synced: new Date().toISOString() })
        .eq("id", profile.id);

      synced++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ synced, failed, total: profiles.length });
}
