import { createClient as createServerClient } from "@supabase/supabase-js";
import { syncEventsSnapshot } from "@/lib/event-sync";
import { fetchAndParseICS } from "@/lib/ics-parser";
import { apiErrors } from "@/lib/api-error";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiErrors.unauthorized("invalid cron secret");
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
      await syncEventsSnapshot(supabase, profile.id, events);

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
