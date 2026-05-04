"use client";

import { useToast } from "@/components/toast-provider";
import { useEffect, useState } from "react";

type SupportState = "checking" | "unsupported" | "supported";

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const cleanValue = base64String
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\[rn]/g, "")
    .replace(/\s+/g, "")
    .replace(/=+$/g, "");
  if (!/^[A-Za-z0-9_-]+$/.test(cleanValue)) {
    throw new Error("푸시 알림 공개 키 형식이 올바르지 않습니다");
  }

  const padding = "=".repeat((4 - (cleanValue.length % 4)) % 4);
  const base64 = `${cleanValue}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  let rawData = "";

  try {
    rawData = window.atob(base64);
  } catch {
    throw new Error("푸시 알림 공개 키 형식이 올바르지 않습니다");
  }

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getServiceWorkerRegistration() {
  const current = await navigator.serviceWorker.getRegistration("/");
  if (current) return current;
  return navigator.serviceWorker.register("/sw.js");
}

export default function PushNotificationControl() {
  const toast = useToast();
  const [support, setSupport] = useState<SupportState>("checking");
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [iosLike, setIosLike] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupport(supported ? "supported" : "unsupported");
    setStandalone(isStandaloneDisplay());
    setIosLike(/iPhone|iPad|iPod/.test(navigator.userAgent));
    if (!supported) return;

    setPermission(Notification.permission);
    void getServiceWorkerRegistration()
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(Boolean(subscription)))
      .catch(() => undefined);
  }, []);

  async function saveSubscription(subscription: PushSubscription) {
    const response = await fetch("/api/push/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : "알림 구독 저장에 실패했습니다"
      );
    }
  }

  async function removeSubscription(endpoint: string) {
    await fetch("/api/push/subscription", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  }

  async function handleSubscribe() {
    if (support !== "supported" || busy) return;

    setBusy(true);
    try {
      const keyResponse = await fetch("/api/push/vapid-public-key", {
        cache: "no-store",
      });
      const keyData = (await keyResponse.json().catch(() => ({}))) as {
        publicKey?: string;
        error?: string;
      };
      if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error(keyData.error || "푸시 알림 서버 설정이 필요합니다");
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        toast.info("알림 권한이 허용되지 않았습니다");
        return;
      }

      const registration = await getServiceWorkerRegistration();
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        }));

      await saveSubscription(subscription);
      setSubscribed(true);
      toast.success("근무 교환 알림을 켰습니다");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "알림 설정에 실패했습니다"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    if (support !== "supported" || busy) return;

    setBusy(true);
    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscription(subscription.endpoint);
      }
      setSubscribed(false);
      toast.success("근무 교환 알림을 껐습니다");
    } catch {
      toast.error("알림 해제에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  const unavailable =
    support === "unsupported" ||
    permission === "denied" ||
    (!standalone && iosLike);

  return (
    <section
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            근무 교환 게시판 알림
          </h2>
        </div>
        <button
          type="button"
          disabled={busy || support === "checking" || unavailable}
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50"
          style={{
            backgroundColor: subscribed
              ? "var(--button-surface)"
              : "var(--primary)",
            color: subscribed
              ? "var(--text-primary)"
              : "var(--text-on-primary)",
          }}
        >
          {busy ? "처리중" : subscribed ? "끄기" : "켜기"}
        </button>
      </div>
      {support === "unsupported" && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          이 브라우저는 푸시 알림을 지원하지 않습니다.
        </p>
      )}
      {permission === "denied" && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          브라우저 설정에서 알림 권한을 다시 허용해주세요.
        </p>
      )}
      {!standalone && support === "supported" && permission !== "denied" && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          홈 화면에 추가한 앱으로 실행해야 알림이 울립니다.
        </p>
      )}
    </section>
  );
}
