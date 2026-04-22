import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { apiError, apiErrors } from "@/lib/api-error";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const { error } = await supabase
    .from("couple_requests")
    .update({ status: "accepted" })
    .eq("id", id)
    .eq("partner_id", user.id);

  if (error) return apiError(500, error.message);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const { error } = await supabase
    .from("couple_requests")
    .delete()
    .eq("id", id)
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`);

  if (error) return apiError(500, error.message);

  return NextResponse.json({ success: true });
}
