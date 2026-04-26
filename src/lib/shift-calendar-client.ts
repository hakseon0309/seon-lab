import { toEventMap } from "@/lib/swap-board";
import { SwapEvent } from "@/lib/types";

const shiftRangeCache = new Map<string, Promise<Map<string, SwapEvent>>>();

export function loadShiftEventsByDateRange(from: string, to: string) {
  const key = `${from}:${to}`;
  const cached = shiftRangeCache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const response = await fetch(`/api/shifts/me?from=${from}&to=${to}`);
    if (!response.ok) {
      throw new Error("shift_range_fetch_failed");
    }

    const data = await response.json().catch(() => ({ events: [] }));
    return toEventMap(data.events ?? []);
  })();

  shiftRangeCache.set(key, request);
  request.catch(() => {
    shiftRangeCache.delete(key);
  });

  return request;
}
