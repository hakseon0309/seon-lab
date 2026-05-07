import { Board } from "@/lib/types";
import { toWorkTerminology } from "@/lib/terminology";

export function isShiftSwapBoard(
  board: Pick<Board, "kind" | "slug"> | null | undefined
) {
  return board?.kind === "chat" && board?.slug === "shift-swap";
}

export function getBoardDisplayName(name: string) {
  return toWorkTerminology(name)
    .replaceAll("근무 교환", "근무 일정 교환")
    .replaceAll("패치 노트", "패치노트");
}
