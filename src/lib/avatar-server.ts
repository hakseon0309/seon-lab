import { AVATAR_BUCKET, MAX_AVATAR_BYTES } from "@/lib/avatar";

export async function fileFromFormData(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return { error: "파일을 선택해주세요" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "이미지 파일만 업로드할 수 있습니다" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "3MB 이하의 이미지만 업로드할 수 있습니다" };
  }
  return { file };
}

export function avatarPath(scope: "users" | "teams", ownerId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = ext || file.type.split("/")[1] || "jpg";
  return `${scope}/${ownerId}/${Date.now()}.${safeExt}`;
}

export function publicAvatarUrl(
  storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } },
  path: string
) {
  return storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}
