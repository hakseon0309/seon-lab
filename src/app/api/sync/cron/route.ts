import { createClient as createServerClient } from "@supabase/supabase-js";
import { fetchAndParseICS } from "@/lib/ics-parser";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role to bypass RLS
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, ics_url")
    .not("ics_url", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: "No profiles to sync" });
  }

  let synced = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      const events = await fetchAndParseICS(profile.ics_url!);

      for (const event of events) {
        await supabase.from("events").upsert(
          {
            user_id: profile.id,
            uid: event.uid,
            summary: event.summary,
            start_at: event.startAt.toISOString(),
            end_at: event.endAt.toISOString(),
            location: event.location,
          },
          { onConflict: "user_id,uid" }
        );
      }

      await supabase
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
