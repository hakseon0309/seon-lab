import { createClient } from "@/lib/supabase/server";

export const SIGNUP_ACCESS_CODE = "apple";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
type AdminSupabase = Pick<ServerSupabase, "from">;

export type AccessProfile = {
  access_granted_at?: string | null;
  onboarding_completed_at?: string | null;
};

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

export function accessCodePath(next: string | null | undefined) {
  const safeNext = safeNextPath(next);
  return `/access-code?next=${encodeURIComponent(safeNext)}`;
}

export function hasAppAccess(profile: AccessProfile | null | undefined) {
  return Boolean(profile?.access_granted_at);
}

export function routeAfterAccess(
  profile: Pick<AccessProfile, "onboarding_completed_at"> | null | undefined,
  next: string | null | undefined
) {
  return profile?.onboarding_completed_at ? safeNextPath(next) : "/onboarding";
}

export function isValidSignupCode(code: unknown) {
  return (
    typeof code === "string" &&
    code.trim().toLowerCase() === SIGNUP_ACCESS_CODE
  );
}

export async function emailIsAllowed(
  admin: AdminSupabase,
  email: string | null | undefined
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const { data } = await admin
    .from("allowed_users")
    .select("email, revoked_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  return Boolean(data && !data.revoked_at);
}

export async function grantAppAccess({
  admin,
  userId,
  email,
  source,
}: {
  admin: AdminSupabase;
  userId: string;
  email: string | null | undefined;
  source: "legacy" | "signup_code" | "admin";
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { ok: false as const, error: "이메일을 확인할 수 없습니다" };
  }

  const now = new Date().toISOString();
  const { error: allowError } = await admin.from("allowed_users").upsert(
    {
      email: normalizedEmail,
      source,
      created_by: source === "signup_code" ? userId : null,
    },
    { onConflict: "email", ignoreDuplicates: true }
  );

  if (allowError) {
    return { ok: false as const, error: allowError.message };
  }

  const allowed = await emailIsAllowed(admin, normalizedEmail);
  if (!allowed) {
    return { ok: false as const, error: "허용되지 않은 이메일입니다" };
  }

  const { data: updatedProfile, error: updateError } = await admin
    .from("user_profiles")
    .update({ access_granted_at: now })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  if (updatedProfile) {
    return { ok: true as const };
  }

  const { error: profileError } = await admin.from("user_profiles").insert({
    id: userId,
    display_name: normalizedEmail.split("@")[0] || "",
    access_granted_at: now,
  });

  if (profileError) {
    return { ok: false as const, error: profileError.message };
  }

  return { ok: true as const };
}

export async function loadAccessProfile(
  supabase: ServerSupabase,
  userId: string
) {
  const { data } = await supabase
    .from("user_profiles")
    .select("access_granted_at, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  return (data as AccessProfile | null) ?? null;
}
