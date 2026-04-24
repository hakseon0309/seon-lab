/**
 * 전역 오버레이 상호 배타 버스.
 *
 * 사이드바와 알림 사이드바가 동시에 열리면 시각적으로 겹치고 탈출 경로가 꼬이므로,
 * 어떤 오버레이가 열리는 순간 다른 오버레이는 자동으로 닫히도록 조율한다.
 *
 * 사용법:
 *   - 오버레이를 열 때: broadcastOverlayOpen("sidebar") 혹은 "notifications"
 *   - 컴포넌트 마운트 시: onOtherOverlayOpen(self, () => setOpen(false)) 를 구독
 */
export type OverlayName = "sidebar" | "notifications";
const EVENT = "seonlab:overlay-open";

export function broadcastOverlayOpen(name: OverlayName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { name } }));
}

export function onOtherOverlayOpen(
  self: OverlayName,
  handler: () => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent).detail as { name?: OverlayName } | undefined;
    if (detail?.name && detail.name !== self) handler();
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
