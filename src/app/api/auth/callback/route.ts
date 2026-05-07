import { createClient } from "@/lib/supabase/server";
import { accessCodePath } from "@/lib/access-gate";
import { mapOAuthErrorToKorean } from "@/lib/oauth-error";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function redirectWithError(origin: string, code: string, raw?: string) {
  const params = new URLSearchParams();
  params.set("error", mapOAuthErrorToKorean(code));
  params.set("code", code);
  if (raw) params.set("raw", raw);
  return noStoreRedirect(`${origin}/?${params.toString()}`);
}

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function noStoreRedirect(url: string) {
  return NextResponse.redirect(url, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function redirectAfterSessionExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  next: string
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user && !error) {
    return noStoreRedirect(`${origin}${accessCodePath(next)}`);
  }

  console.error(
    "[auth/callback] session verification:",
    error?.message ?? "missing user after session exchange"
  );
  return redirectWithError(origin, "invalid_grant", error?.message);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

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
      return redirectAfterSessionExchange(supabase, origin, next);
    }
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return redirectWithError(origin, "invalid_grant", error.message);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return redirectAfterSessionExchange(supabase, origin, next);
    }
    console.error("[auth/callback] verifyOtp:", error.message);
    return redirectWithError(origin, "invalid_grant", error.message);
  }

  return redirectWithError(origin, "invalid_request", "missing code");
}
