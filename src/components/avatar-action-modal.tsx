"use client";

import Modal from "@/components/modal";
import { validateAvatarFile } from "@/lib/avatar";
import { useRef, useState } from "react";

interface AvatarActionModalProps {
  title: string;
  hasImage: boolean;
  uploading: boolean;
  deleting: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function AvatarActionModal({
  title,
  hasImage,
  uploading,
  deleting,
  onClose,
  onUpload,
  onDelete,
}: AvatarActionModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const message = validateAvatarFile(file);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    await onUpload(file);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading || deleting}
          onClick={() => inputRef.current?.click()}
          className="interactive-press w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          {uploading ? "업로드 중..." : "사진 업로드"}
        </button>
        <button
          type="button"
          disabled={!hasImage || uploading || deleting}
          onClick={onDelete}
          className="interactive-press w-full rounded-lg border px-4 py-3 text-sm font-medium disabled:opacity-40"
          style={{
            borderColor: "var(--border-light)",
            color: hasImage ? "var(--error)" : "var(--text-muted)",
          }}
        >
          {deleting ? "삭제 중..." : "사진 삭제"}
        </button>
        {error && (
          <p className="text-center text-xs" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
