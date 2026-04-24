import Image from "next/image";
import { avatarInitial } from "@/lib/avatar";

interface AvatarImageProps {
  src?: string | null;
  name: string;
  sizeClass?: string;
  textClass?: string;
}

export default function AvatarImage({
  src,
  name,
  sizeClass = "h-12 w-12",
  textClass = "text-sm",
}: AvatarImageProps) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass}`}
      style={{
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-muted)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className={`font-semibold ${textClass}`}>{avatarInitial(name)}</span>
      )}
    </span>
  );
}
