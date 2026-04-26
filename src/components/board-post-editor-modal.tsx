"use client";

import Modal from "@/components/modal";
import type { FormEvent } from "react";

interface AnonymousOption {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface Props {
  open: boolean;
  modalTitle: string;
  titleValue: string;
  bodyValue: string;
  saving: boolean;
  submitLabel: string;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  bodyRows?: number;
  anonymousOption?: AnonymousOption;
  onClose: () => void;
  onChangeTitle: (value: string) => void;
  onChangeBody: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export default function BoardPostEditorModal({
  open,
  modalTitle,
  titleValue,
  bodyValue,
  saving,
  submitLabel,
  titlePlaceholder = "제목",
  bodyPlaceholder = "내용",
  bodyRows = 8,
  anonymousOption,
  onClose,
  onChangeTitle,
  onChangeBody,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <Modal
      title={modalTitle}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={titleValue}
          onChange={(event) => onChangeTitle(event.target.value)}
          placeholder={titlePlaceholder}
          maxLength={120}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={
            {
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties
          }
        />
        <textarea
          value={bodyValue}
          onChange={(event) => onChangeBody(event.target.value)}
          placeholder={bodyPlaceholder}
          rows={bodyRows}
          className="w-full resize-none rounded-lg border px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2"
          style={
            {
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties
          }
        />
        {anonymousOption && (
          <label
            className="flex items-center gap-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <input
              type="checkbox"
              checked={anonymousOption.checked}
              onChange={(event) => anonymousOption.onChange(event.target.checked)}
            />
            익명으로 작성
          </label>
        )}
        <button
          type="submit"
          disabled={saving}
          className="interactive-press w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          {saving ? `${submitLabel} 중…` : submitLabel}
        </button>
      </form>
    </Modal>
  );
}
