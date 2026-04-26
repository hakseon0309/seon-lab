import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiErrors } from "@/lib/api-error";
import {
  getSeoulIsoDayRange,
  getSeoulIsoInclusiveDateRange,
} from "@/lib/time";

// GET /api/shifts/me?date=YYYY-MM-DD
//   → 해당 하루의 내 시프트 1건 (없으면 null).
// GET /api/shifts/me?from=YYYY-MM-DD&to=YYYY-MM-DD  (to 포함)
//   → 범위 내 모든 시프트. 미니 달력용.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return apiErrors.badRequest("date(YYYY-MM-DD)가 필요합니다");
    const { startISO, endISO } = getSeoulIsoDayRange(date);
    const { data } = await supabase
      .from("events")
      .select("summary, start_at, end_at")
      .eq("user_id", user.id)
      .gte("start_at", startISO)
      .lt("start_at", endISO)
      .order("start_at", { ascending: true })
      .limit(1);
    return NextResponse.json({ event: data?.[0] ?? null });
  }

  if (from && to) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
      return apiErrors.badRequest("from/to(YYYY-MM-DD)가 필요합니다");
    const { startISO, endISO } = getSeoulIsoInclusiveDateRange(from, to);
    const { data } = await supabase
      .from("events")
      .select("summary, start_at, end_at")
      .eq("user_id", user.id)
      .gte("start_at", startISO)
      .lt("start_at", endISO)
      .order("start_at", { ascending: true });
    return NextResponse.json({ events: data ?? [] });
  }

  return apiErrors.badRequest("date 또는 from/to 가 필요합니다");
}
