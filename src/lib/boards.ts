import { Board } from "@/lib/types";
import { toWorkTerminology } from "@/lib/terminology";

export function isShiftSwapBoard(
  board: Pick<Board, "kind" | "slug"> | null | undefined
) {
  return board?.kind === "chat" && board?.slug === "shift-swap";
}

export function getBoardDisplayName(name: string) {
  return toWorkTerminology(name);
}
