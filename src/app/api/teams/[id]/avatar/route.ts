import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiErrors } from "@/lib/api-error";
import { requireTeamOwner } from "@/lib/team-auth";
import { AVATAR_BUCKET } from "@/lib/avatar";
import { avatarPath, fileFromFormData, publicAvatarUrl } from "@/lib/avatar-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const ownerCheck = await requireTeamOwner(supabase, id, user.id);
  if (!ownerCheck.ok) return ownerCheck.response;

  const parsed = await fileFromFormData(request);
  if ("error" in parsed) return apiErrors.badRequest(parsed.error);

  const admin = createAdminClient();
  const path = avatarPath("teams", id, parsed.file);
  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, parsed.file, {
      contentType: parsed.file.type,
      upsert: true,
    });

  if (uploadError) return apiError(500, uploadError.message);

  const image_url = publicAvatarUrl(admin.storage, path);
  const { data: previous } = await supabase
    .from("teams")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("teams")
    .update({ image_url, image_path: path })
    .eq("id", id)
    .select()
    .single();

  if (error) return apiError(500, error.message);

  const previousPath = previous?.image_path;
  if (previousPath && previousPath !== path) {
    await admin.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");
  revalidatePath("/dashboard");
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

  const ownerCheck = await requireTeamOwner(supabase, id, user.id);
  if (!ownerCheck.ok) return ownerCheck.response;

  const { data: previous } = await supabase
    .from("teams")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("teams")
    .update({ image_url: null, image_path: null })
    .eq("id", id)
    .select()
    .single();

  if (error) return apiError(500, error.message);

  if (previous?.image_path) {
    const admin = createAdminClient();
    await admin.storage.from(AVATAR_BUCKET).remove([previous.image_path]);
  }

  revalidatePath(`/teams/${id}`);
  revalidatePath("/teams");
  revalidatePath("/dashboard");
  return NextResponse.json(data);
}
