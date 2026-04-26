"use client";

import { useClientReady } from "@/lib/client-dom";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState("");
  const mounted = useClientReady();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = `qr-reader-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      scannerRef.current?.stop().catch(() => {});
      onClose();
    };
    document.addEventListener("keydown", handleEscape);

    const scanner = new Html5Qrcode(containerId);
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
      document.removeEventListener("keydown", handleEscape);
      scanner.stop().catch(() => {});
    };
  }, [containerId, onClose, onScan]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 1000 }}
      onClick={() => {
        scannerRef.current?.stop().catch(() => {});
        onClose();
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgb(0 0 0 / 0.6)" }}
      />
      <div
        className="relative mx-4 w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            QR 코드 스캔
          </h3>
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
              id={containerId}
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
    </div>,
    document.body
  );
}
