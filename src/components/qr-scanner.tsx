"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>(
    "qr-reader-" + Math.random().toString(36).slice(2)
  );

  useEffect(() => {
    const scanner = new Html5Qrcode(containerRef.current);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const code = decodedText.trim().toUpperCase();
          if (/^[A-Z0-9]{6}$/.test(code)) {
            scanner.stop().catch(() => {});
            onScan(code);
          }
        },
        () => {}
      )
      .catch(() => {
        setError("카메라 접근 권한이 필요합니다. 브라우저 설정에서 허용해주세요.");
      });

    return () => {
      scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            QR 코드 스캔
          </h3>
          <button
            onClick={() => {
              scannerRef.current?.stop().catch(() => {});
              onClose();
            }}
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            닫기
          </button>
        </div>

        {error ? (
          <div
            className="rounded-lg p-4 text-center text-sm"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}
          >
            {error}
          </div>
        ) : (
          <>
            <div
              id={containerRef.current}
              className="overflow-hidden rounded-lg"
            />
            <p
              className="mt-3 text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              팀장이 보여주는 QR 코드를 카메라에 비춰주세요
            </p>
          </>
        )}
      </div>
    </div>
  );
}
