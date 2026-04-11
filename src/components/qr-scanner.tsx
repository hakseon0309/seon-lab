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
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));

  useEffect(() => {
    const scanner = new Html5Qrcode(containerRef.current);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // 6자리 영문+숫자 코드만 허용
          const code = decodedText.trim().toUpperCase();
          if (/^[A-Z0-9]{6}$/.test(code)) {
            scanner.stop().catch(() => {});
            onScan(code);
          }
        },
        () => {} // ignore scan failures
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">QR 코드 스캔</h3>
          <button
            onClick={() => {
              scannerRef.current?.stop().catch(() => {});
              onClose();
            }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            닫기
          </button>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <div
              id={containerRef.current}
              className="overflow-hidden rounded-lg"
            />
            <p className="mt-3 text-center text-xs text-gray-400">
              팀장이 보여주는 QR 코드를 카메라에 비춰주세요
            </p>
          </>
        )}
      </div>
    </div>
  );
}
