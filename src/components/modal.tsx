"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ title, onClose, children, maxWidth = "max-w-sm" }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl p-6`}
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
