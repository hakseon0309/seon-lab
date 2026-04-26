"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function useClientReady() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function usePortalTarget(id: string) {
  const ready = useClientReady();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!ready) return;

    function syncTarget() {
      setTarget(document.getElementById(id));
    }

    syncTarget();

    if (document.getElementById(id)) return;

    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [id, ready]);

  return target;
}
