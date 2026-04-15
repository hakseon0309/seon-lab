import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(oauthErrorDescription ?? oauthError)}`
    );
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] verifyOtp:", error.message);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/?error=${encodeURIComponent("인증 코드가 없습니다")}`);
}
