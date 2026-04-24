import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors } from "@/lib/api-error";

// PATCH /api/notifications/:id/read : 단건 읽음 처리
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiErrors.unauthorized();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), unread_count: 0 })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return apiError(500, error.message);
  return NextResponse.json({ success: true });
}
