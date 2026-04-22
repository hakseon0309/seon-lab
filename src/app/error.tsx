"use client";

import Link from "next/link";
import { useEffect } from "react";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <>
      <Nav />
      <PageHeader>
        <div />
      </PageHeader>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-24 lg:pb-8 text-center">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          문제가 발생했어요
        </h1>
        <p
          className="mt-2 max-w-sm text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          잠시 후 다시 시도해주세요. 같은 증상이 이어지면 관리자에게 알려주세요.
        </p>
        {error.digest && (
          <p
            className="mt-3 font-mono text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            코드: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            다시 시도
          </button>
          <Link
            href="/dashboard"
            className="interactive-press rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            홈으로
          </Link>
        </div>
      </main>
    </>
  );
}
