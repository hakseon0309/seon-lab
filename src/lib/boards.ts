import { Board } from "@/lib/types";

export function isShiftSwapBoard(
  board: Pick<Board, "kind" | "slug"> | null | undefined
) {
  return board?.kind === "chat" && board?.slug === "shift-swap";
}
