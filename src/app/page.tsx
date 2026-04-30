"use client";

import { createClient } from "@/lib/supabase/client";
import RouteTransitionDone from "@/components/route-transition-done";
import { useRouteTransition } from "@/components/route-transition-provider";
import { useToast } from "@/components/toast-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function HomeContent() {
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { startNavigation, stopNavigation } = useRouteTransition();
  const handledReasonRef = useRef(false);
  const urlError = searchParams.get("error");
  const error = authError || (urlError ? decodeURIComponent(urlError) : "");
  const errorCode = searchParams.get("code") ?? "";

  useEffect(() => {
    if (handledReasonRef.current) return;
    const reason = searchParams.get("reason");
    if (reason === "expired") {
      handledReasonRef.current = true;
      toast.info("세션이 만료되었습니다. 다시 로그인해주세요");
      const url = new URL(window.location.href);
      url.searchParams.delete("reason");
      router.replace(url.pathname + (url.search || ""));
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoading(false);
        stopNavigation();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [stopNavigation]);

  async function handleGoogleLogin() {
    setAuthError("");
    setLoading(true);
    startNavigation();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
      stopNavigation();
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <RouteTransitionDone />
      <div className="w-full max-w-sm space-y-8 px-6 text-center">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--primary)" }}
          >
            SEON LAB
          </h1>
          <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
            팀 근무 일정 공유 서비스
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            캘린더 구독 URL 기반
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
          >
            <p>{error}</p>
            {errorCode && (
              <p className="mt-1 font-mono text-xs opacity-70">
                코드: {errorCode}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--text-secondary)",
          }}
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
