import { createClient as createServerClient } from "@supabase/supabase-js";
import { syncEventsSnapshot } from "@/lib/event-sync";
import { fetchAndParseICS } from "@/lib/ics-parser";
import { apiError, apiErrors } from "@/lib/api-error";
import { getCompletedSwapPostExpiryCutoff } from "@/lib/shift-swap-retention";
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

  let synced = 0;
  let failed = 0;
  const profileList = profiles ?? [];

  for (const profile of profileList) {
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

  const { data: shiftSwapBoard, error: boardError } = await supabase
    .from("boards")
    .select("id")
    .eq("slug", "shift-swap")
    .maybeSingle();
  let deletedCompletedSwapPosts = 0;

  if (boardError) return apiError(500, boardError.message);

  if (shiftSwapBoard?.id) {
    const { count, error } = await supabase
      .from("board_posts")
      .delete({ count: "exact" })
      .eq("board_id", shiftSwapBoard.id)
      .eq("swap_status", "done")
      .lte("completed_at", getCompletedSwapPostExpiryCutoff());

    if (error) return apiError(500, error.message);
    deletedCompletedSwapPosts = count ?? 0;
  }

  return NextResponse.json({
    synced,
    failed,
    total: profileList.length,
    deletedCompletedSwapPosts,
  });
}
