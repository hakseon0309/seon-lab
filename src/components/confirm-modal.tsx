"use client";

import Modal from "@/components/modal";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  loading = false,
  destructive = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={loading ? () => {} : onClose} maxWidth="max-w-xs">
      <div className="space-y-5">
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="interactive-press flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-card)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="interactive-press flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: destructive ? "var(--error)" : "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
