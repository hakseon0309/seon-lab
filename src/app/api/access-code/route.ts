import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import {
  grantAppAccess,
  isValidSignupCode,
  loadAccessProfile,
  routeAfterAccess,
  safeNextPath,
} from "@/lib/access-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type AccessCodeBody = {
  code?: unknown;
  next?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<AccessCodeBody>(request);
  if (!parsed.ok) return parsed.response;

  if (!isValidSignupCode(parsed.body.code)) {
    return apiError(403, "초대 코드가 올바르지 않습니다", "invalid_access_code");
  }

  const admin = createAdminClient();
  const result = await grantAppAccess({
    admin,
    userId: user.id,
    email: user.email,
    source: "signup_code",
  });

  if (!result.ok) {
    return apiErrors.server("접근 권한 저장에 실패했습니다", result.error);
  }

  const profile = await loadAccessProfile(supabase, user.id);
  const next =
    typeof parsed.body.next === "string" ? parsed.body.next : "/dashboard";

  return NextResponse.json({
    success: true,
    redirect_to: routeAfterAccess(profile, safeNextPath(next)),
  });
}
