import AvatarImage from "@/components/avatar-image";
import type { Team } from "@/lib/types";

interface TeamAvatarProps {
  team: Pick<Team, "name" | "image_url">;
  sizeClass?: string;
}

export default function TeamAvatar({
  team,
  sizeClass = "h-11 w-11",
}: TeamAvatarProps) {
  return (
    <AvatarImage
      src={team.image_url ?? null}
      name={team.name}
      sizeClass={sizeClass}
    />
  );
}
