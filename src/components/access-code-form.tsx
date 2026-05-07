"use client";

import { useRouteTransition } from "@/components/route-transition-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccessCodeForm({ next }: { next: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { startNavigation } = useRouteTransition();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/access-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, next }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "코드를 확인하지 못했습니다"
      );
      setSubmitting(false);
      return;
    }

    startNavigation();
    router.replace(
      typeof data.redirect_to === "string" ? data.redirect_to : "/onboarding"
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-lg border p-4"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div className="text-center">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          SEON LAB
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          초대 코드를 입력해주세요
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          초대 코드
        </label>
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoCapitalize="none"
          autoComplete="one-time-code"
          className="mt-1 w-full rounded-lg border px-3 py-2.5 text-center text-sm shadow-sm focus:outline-none focus:ring-2"
          style={
            {
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties
          }
          placeholder="코드 입력"
        />
      </div>

      {error && (
        <p
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || code.trim().length === 0}
        className="interactive-press w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--text-on-primary)",
        }}
      >
        {submitting ? "확인 중..." : "확인"}
      </button>
    </form>
  );
}
