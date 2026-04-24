"use client";

import AvatarActionModal from "@/components/avatar-action-modal";
import AvatarImage from "@/components/avatar-image";
import { useToast } from "@/components/toast-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProfileAvatarControlProps {
  initialAvatarUrl?: string | null;
  displayName: string;
}

export default function ProfileAvatarControl({
  initialAvatarUrl,
  displayName,
}: ProfileAvatarControlProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function upload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      toast.error(data.error || "프로필 사진 업로드에 실패했습니다");
      return;
    }

    setAvatarUrl(data.avatar_url ?? null);
    window.dispatchEvent(new Event("seonlab:profile-updated"));
    toast.success("프로필 사진을 변경했습니다");
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);

    if (!res.ok) {
      toast.error(data.error || "프로필 사진 삭제에 실패했습니다");
      return;
    }

    setAvatarUrl(null);
    window.dispatchEvent(new Event("seonlab:profile-updated"));
    toast.success("프로필 사진을 삭제했습니다");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {/* 프로필 사진은 설정 페이지 섹션의 상하좌우 여백이 동일(p-6 = 24px) 해야 답답해 보이지 않음.
          아바타 크기는 기존 80px 대비 200% 확대 → 240px (h-60 w-60). 편집 배지는 그에 맞춰 비례 확대. */}
      <div className="flex flex-col items-center gap-3 p-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="interactive-press relative"
          aria-label="프로필 사진 변경"
        >
          <AvatarImage
            src={avatarUrl}
            name={displayName}
            sizeClass="h-[160px] w-[160px]"
            textClass="text-5xl"
          />
          <span
            className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-light)",
              color: "var(--primary)",
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </span>
        </button>
        <div className="min-w-0 text-center">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {displayName || "이름 없음"}
          </p>
        </div>
      </div>

      {open && (
        <AvatarActionModal
          title="프로필 사진"
          hasImage={Boolean(avatarUrl)}
          uploading={uploading}
          deleting={deleting}
          onClose={() => setOpen(false)}
          onUpload={upload}
          onDelete={remove}
        />
      )}
    </>
  );
}
