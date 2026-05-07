import { createClient as createSbClient } from "@supabase/supabase-js";
import { hasAppAccess } from "@/lib/access-gate";
import { createClient as createServerClient } from "@/lib/supabase/server";

export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type AdminGuardResult =
  | { error: string; status: 401 | 403; user?: undefined }
  | { user: { id: string }; error?: undefined; status?: undefined };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다", status: 401 };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin, access_granted_at")
    .eq("id", user.id)
    .single();

  if (!hasAppAccess(profile)) {
    return { error: "초대 코드 확인이 필요합니다", status: 403 };
  }

  if (!profile?.is_admin) return { error: "관리자 권한이 필요합니다", status: 403 };
  return { user };
}
