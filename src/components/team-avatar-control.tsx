"use client";

import AvatarActionModal from "@/components/avatar-action-modal";
import AvatarImage from "@/components/avatar-image";
import { Team } from "@/lib/types";
import { useToast } from "@/components/toast-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TeamAvatarControlProps {
  team: Team;
  editable?: boolean;
  onUpdated?: (team: Team) => void;
  sizeClass?: string;
}

export default function TeamAvatarControl({
  team,
  editable = false,
  onUpdated,
  sizeClass = "h-11 w-11",
}: TeamAvatarControlProps) {
  const [imageUrl, setImageUrl] = useState(team.image_url ?? null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function upload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/teams/${team.id}/avatar`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      toast.error(data.error || "팀 프로필 사진 업로드에 실패했습니다");
      return;
    }

    setImageUrl(data.image_url ?? null);
    onUpdated?.(data as Team);
    toast.success("팀 프로필 사진을 변경했습니다");
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/teams/${team.id}/avatar`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);

    if (!res.ok) {
      toast.error(data.error || "팀 프로필 사진 삭제에 실패했습니다");
      return;
    }

    setImageUrl(null);
    onUpdated?.(data as Team);
    toast.success("팀 프로필 사진을 삭제했습니다");
    setOpen(false);
    router.refresh();
  }

  const avatar = (
    <>
      <AvatarImage src={imageUrl} name={team.name} sizeClass={sizeClass} />
      {editable && (
        <span
          className="absolute right-[-2px] top-[-2px] flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-light)",
            color: "var(--primary)",
          }}
        >
          +
        </span>
      )}
    </>
  );

  return (
    <>
      {editable ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="interactive-press relative shrink-0"
          aria-label="팀 프로필 사진 변경"
        >
          {avatar}
        </button>
      ) : (
        <span className="relative shrink-0">{avatar}</span>
      )}

      {open && (
        <AvatarActionModal
          title="팀 프로필 사진"
          hasImage={Boolean(imageUrl)}
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
