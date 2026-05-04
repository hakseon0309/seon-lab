export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_MB = 5;

export function validateAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "이미지 파일만 업로드할 수 있습니다";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return `${MAX_AVATAR_MB}MB 이하의 이미지만 업로드할 수 있습니다`;
  }
  return null;
}

export function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : "?";
}
