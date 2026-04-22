"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[90] border-b px-4 py-2 text-center text-xs"
      style={{
        backgroundColor: "var(--error-bg)",
        color: "var(--error)",
        borderColor: "var(--border-light)",
      }}
    >
      인터넷 연결이 끊어졌어요. 일부 기능이 제한될 수 있어요.
    </div>
  );
}
