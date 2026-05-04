"use client";

import Modal from "@/components/modal";
import PushNotificationControl from "@/components/push-notification-control";
import { useEffect, useState } from "react";

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function hasPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return Boolean(subscription);
}

export default function StandalonePushPrompt({ userId }: { userId: string }) {
  const storageKey = `seon-lab:pwa-push-prompt-seen:${userId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isStandaloneDisplay()) return;
    if (!("Notification" in window)) return;
    if (window.localStorage.getItem(storageKey) === "1") return;

    void hasPushSubscription()
      .then((subscribed) => {
        if (subscribed) {
          window.localStorage.setItem(storageKey, "1");
          return;
        }

        setOpen(true);
      })
      .catch(() => setOpen(true));
  }, [storageKey]);

  function close() {
    window.localStorage.setItem(storageKey, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <Modal
      title="근무 교환 알림"
      onClose={close}
      maxWidth="max-w-sm"
      panelClassName="mx-4 p-5"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          근무 교환 게시판의 새 글과 대화 메시지를 바로 받을 수 있어요.
        </p>
        <PushNotificationControl />
        <button
          type="button"
          onClick={close}
          className="interactive-press w-full rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          확인
        </button>
      </div>
    </Modal>
  );
}
