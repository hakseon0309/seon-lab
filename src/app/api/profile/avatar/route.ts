import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiErrors } from "@/lib/api-error";
import { AVATAR_BUCKET } from "@/lib/avatar";
import { avatarPath, fileFromFormData, publicAvatarUrl } from "@/lib/avatar-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await fileFromFormData(request);
  if ("error" in parsed) return apiErrors.badRequest(parsed.error);

  const admin = createAdminClient();
  const path = avatarPath("users", user.id, parsed.file);
  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, parsed.file, {
      contentType: parsed.file.type,
      upsert: true,
    });

  if (uploadError) return apiError(500, uploadError.message);

  const avatar_url = publicAvatarUrl(admin.storage, path);
  const { data: previous } = await admin
    .from("user_profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await admin
    .from("user_profiles")
    .upsert(
      { id: user.id, avatar_url, avatar_path: path },
      { onConflict: "id" }
    )
    .select("avatar_url, avatar_path")
    .single();

  if (error) return apiError(500, error.message);

  const previousPath = previous?.avatar_path;
  if (previousPath && previousPath !== path) {
    await admin.storage.from(AVATAR_BUCKET).remove([previousPath]);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return NextResponse.json(data);
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const admin = createAdminClient();
  const { data: previous } = await admin
    .from("user_profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await admin
    .from("user_profiles")
    .upsert(
      { id: user.id, avatar_url: null, avatar_path: null },
      { onConflict: "id" }
    )
    .select("avatar_url, avatar_path")
    .single();

  if (error) return apiError(500, error.message);

  if (previous?.avatar_path) {
    await admin.storage.from(AVATAR_BUCKET).remove([previous.avatar_path]);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return NextResponse.json(data);
}
