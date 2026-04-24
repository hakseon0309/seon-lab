import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiErrors } from "@/lib/api-error";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return apiErrors.forbidden("참여한 팀만 즐겨찾기할 수 있습니다");

  const { data, error } = await supabase
    .from("team_favorites")
    .upsert({ team_id: id, user_id: user.id }, { onConflict: "user_id,team_id" })
    .select()
    .single();

  if (error) return apiError(500, error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${id}`);
  return NextResponse.json(data);
}

export async function DELETE(
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
    .from("team_favorites")
    .delete()
    .eq("team_id", id)
    .eq("user_id", user.id);

  if (error) return apiError(500, error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${id}`);
  return NextResponse.json({ ok: true });
}
