import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors } from "@/lib/api-error";

// GET /api/notifications/unread-count : 배지 숫자 (읽지 않은 알림 로우 수)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return apiError(500, error.message);

  return NextResponse.json({ count: count ?? 0 });
}
