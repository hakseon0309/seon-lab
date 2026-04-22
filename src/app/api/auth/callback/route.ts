import { createClient } from "@/lib/supabase/server";
import { mapOAuthErrorToKorean } from "@/lib/oauth-error";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function redirectWithError(origin: string, code: string, raw?: string) {
  const params = new URLSearchParams();
  params.set("error", mapOAuthErrorToKorean(code));
  params.set("code", code);
  if (raw) params.set("raw", raw);
  return NextResponse.redirect(`${origin}/?${params.toString()}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  if (oauthError) {
    console.error("[auth/callback] OAuth error:", oauthError, oauthErrorDescription);
    return redirectWithError(origin, oauthError, oauthErrorDescription ?? undefined);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return redirectWithError(origin, "invalid_grant", error.message);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] verifyOtp:", error.message);
    return redirectWithError(origin, "invalid_grant", error.message);
  }

  return redirectWithError(origin, "invalid_request", "missing code");
}
