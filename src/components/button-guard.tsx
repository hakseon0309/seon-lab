"use client";

import { useEffect } from "react";

const LOCK_MS = 700;

export default function ButtonGuard() {
  useEffect(() => {
    const lockedButtons = new WeakMap<HTMLButtonElement, number>();

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (button.disabled) return;

      const now = Date.now();
      const lastClickedAt = lockedButtons.get(button) ?? 0;
      if (now - lastClickedAt < LOCK_MS) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      lockedButtons.set(button, now);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
