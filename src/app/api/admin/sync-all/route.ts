import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { fetchAndParseICS } from "@/lib/ics-parser";
import { syncEventsSnapshot } from "@/lib/event-sync";
import { apiError, apiErrors } from "@/lib/api-error";

export async function POST() {
  const guard = await requireAdmin();
  if (guard.error) {
    return apiError(guard.status, guard.error, "forbidden");
  }

  const admin = createAdminClient();
  const { data: profiles, error: profilesError } = await admin
    .from("user_profiles")
    .select("id, ics_url")
    .not("ics_url", "is", null);

  if (profilesError) {
    return apiErrors.server("프로필 조회에 실패했습니다", profilesError.message);
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
