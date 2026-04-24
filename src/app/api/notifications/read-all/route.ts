import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors } from "@/lib/api-error";

// PATCH /api/notifications/read-all : 내 알림 전부 읽음 처리
export async function PATCH() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), unread_count: 0 })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return apiError(500, error.message);
  return NextResponse.json({ success: true });
}
