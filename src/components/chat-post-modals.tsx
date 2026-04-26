"use client";

import Modal from "@/components/modal";

interface ChatCompleteModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ChatCompleteModal({
  open,
  loading,
  onClose,
  onConfirm,
}: ChatCompleteModalProps) {
  if (!open) return null;

  return (
    <Modal
      title="완료로 변경할까요?"
      onClose={onClose}
    >
      <div className="space-y-4">
        <ul
          className="space-y-1.5 rounded-lg border p-3 text-xs leading-5"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          <li>• 더 이상 메시지를 주고받을 수 없어요.</li>
          <li>• 지금까지의 대화 내용은 7일 후 자정에 자동 삭제됩니다.</li>
          <li>• 필요하면 다시 진행중으로 되돌릴 수 있어요.</li>
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="interactive-press flex-1 rounded-lg border py-2.5 text-sm disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="interactive-press flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            {loading ? "처리 중…" : "완료로 변경"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ChatEditModalProps {
  open: boolean;
  title: string;
  body: string;
  saving: boolean;
  onClose: () => void;
  onChangeTitle: (value: string) => void;
  onChangeBody: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function ChatEditModal({
  open,
  title,
  body,
  saving,
  onClose,
  onChangeTitle,
  onChangeBody,
  onSubmit,
}: ChatEditModalProps) {
  if (!open) return null;

  return (
    <Modal title="글 수정" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
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
          value={body}
          onChange={(e) => onChangeBody(e.target.value)}
          rows={8}
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
        <button
          type="submit"
          disabled={saving}
          className="interactive-press w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </form>
    </Modal>
  );
}
