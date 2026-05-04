import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<{ share_schedule?: unknown }>(request);
  if (!parsed.ok) return parsed.response;
  const { share_schedule } = parsed.body;

  if (typeof share_schedule !== "boolean") {
    return apiErrors.badRequest("share_schedule must be boolean");
  }

  const { data, error } = await supabase
    .from("team_members")
    .update({ share_schedule })
    .eq("team_id", id)
    .eq("user_id", user.id)
    .select("team_id, share_schedule")
    .maybeSingle();

  if (error) return apiError(500, error.message);
  if (!data) return apiErrors.notFound("팀 가입 정보를 찾을 수 없습니다");

  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");
  revalidatePath("/settings");

  return NextResponse.json(data);
}
