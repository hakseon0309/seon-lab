"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function HomeContent() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-8 px-6 text-center">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--primary)" }}
          >
            SEON LAB
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
            팀원들의 근무 시프트를 한눈에 확인하세요
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Apple 캘린더 구독 URL 기반 시프트 공유 서비스
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
          >
            {error}
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
          {loading ? "이동 중..." : "Google로 시작하기"}
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
