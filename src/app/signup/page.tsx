"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-6 px-6 text-center">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            이메일을 확인해주세요
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-secondary)" }}>{email}</strong>
            로 인증 링크를 발송했습니다.
            <br />
            메일함을 확인해주세요.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium hover:underline"
            style={{ color: "var(--primary)" }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
    "--tw-ring-color": "var(--primary)",
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="text-center">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--primary)" }}
          >
            회원가입
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Seon Lab에 가입하여 팀 시프트를 공유하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              표시 이름
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="팀에서 보일 이름"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              이메일
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              비밀번호
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="6자 이상"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "var(--primary)" }}
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
