import { createClient } from "@/lib/supabase/server";
import { hasAppAccess } from "@/lib/access-gate";
import { syncEventsSnapshot } from "@/lib/event-sync";
import { fetchAndParseICS, IcsError, icsErrorToKorean } from "@/lib/ics-parser";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다", code: "unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("ics_url, last_synced, access_granted_at")
    .eq("id", user.id)
    .single();

  if (!hasAppAccess(profile)) {
    return NextResponse.json(
      { error: "초대 코드 확인이 필요합니다", code: "forbidden" },
      { status: 403 }
    );
  }

  if (!profile?.ics_url) {
    return NextResponse.json(
      { error: "캘린더 URL이 설정되어 있지 않아요", code: "no_url" },
      { status: 400 }
    );
  }

  if (profile.last_synced) {
    const lastSynced = new Date(profile.last_synced);
    const cooldown = 30 * 60 * 1000;
    if (Date.now() - lastSynced.getTime() < cooldown) {
      const remaining = Math.ceil(
        (cooldown - (Date.now() - lastSynced.getTime())) / 60000
      );
      return NextResponse.json(
        {
          error: `방금 전에 동기화했어요. ${remaining}분 후 다시 시도해주세요`,
          code: "cooldown",
          remaining_minutes: remaining,
        },
        { status: 429 }
      );
    }
  }

  try {
    const events = await fetchAndParseICS(profile.ics_url);
    await syncEventsSnapshot(supabase, user.id, events);

    await supabase
      .from("user_profiles")
      .update({ last_synced: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ synced: events.length });
  } catch (err) {
    if (err instanceof IcsError) {
      console.error("[sync]", err.code, err.message);
      return NextResponse.json(
        { error: icsErrorToKorean(err.code), code: err.code, raw: err.message },
        { status: err.code === "fetch_timeout" ? 504 : 502 }
      );
    }
    const raw = err instanceof Error ? err.message : String(err);
    console.error("[sync] unexpected", raw);
    return NextResponse.json(
      { error: "동기화 중 문제가 발생했어요", code: "unknown", raw },
      { status: 500 }
    );
  }
}
