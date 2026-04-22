"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#ffffff",
          color: "#111111",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            앱을 불러오지 못했어요
          </h1>
          <p style={{ marginTop: 8, fontSize: "0.875rem", color: "#666" }}>
            페이지를 새로고침해주세요. 문제가 이어지면 관리자에게 알려주세요.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 12,
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#999",
              }}
            >
              코드: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "none",
              background: "#111",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
