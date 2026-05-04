"use client";

import { CoupleStatus } from "@/lib/types";
import { type FormEvent, useState } from "react";
import { useToast } from "@/components/toast-provider";

export default function CoupleSettingsPanel({ initialCoupleStatus }: { initialCoupleStatus: CoupleStatus }) {
  const [coupleStatus, setCoupleStatus] = useState<CoupleStatus>(initialCoupleStatus);
  const [partnerCodeInput, setPartnerCodeInput] = useState("");
  const [coupleMessage, setCoupleMessage] = useState("");
  const [coupleLoading, setCoupleLoading] = useState(false);
  const toast = useToast();

  async function refreshCoupleStatus() {
    const res = await fetch("/api/couples");
    if (res.ok) {
      setCoupleStatus(await res.json());
    }
  }

  async function handleCoupleRequest(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!partnerCodeInput.trim()) return;
    setCoupleLoading(true);
    setCoupleMessage("");
    const res = await fetch("/api/couples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couple_code: partnerCodeInput.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCoupleMessage(data.error);
      toast.error(data.error || "요청에 실패했습니다");
    } else {
      await refreshCoupleStatus();
      setPartnerCodeInput("");
      toast.success("연결 요청을 보냈습니다");
    }
    setCoupleLoading(false);
  }

  async function handleCoupleAccept() {
    if (!coupleStatus?.request_id) return;
    setCoupleLoading(true);
    const res = await fetch(`/api/couples/${coupleStatus.request_id}`, { method: "PATCH" });
    if (res.ok) {
      toast.success("연결이 완료되었습니다");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "수락에 실패했습니다");
    }
    await refreshCoupleStatus();
    setCoupleLoading(false);
  }

  async function handleCoupleDelete() {
    if (!coupleStatus?.request_id) return;
    const prevStatus = coupleStatus.status;
    setCoupleLoading(true);
    const res = await fetch(`/api/couples/${coupleStatus.request_id}`, { method: "DELETE" });
    if (res.ok) {
      setCoupleStatus({
        couple_code: coupleStatus.couple_code,
        status: "none",
        request_id: null,
        partner_id: null,
        partner_name: null,
      });
      const msg =
        prevStatus === "accepted"
          ? "연결을 해제했습니다"
          : prevStatus === "pending_sent"
            ? "요청을 취소했습니다"
            : "요청을 거절했습니다";
      toast.success(msg);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "처리에 실패했습니다");
    }
    setCoupleLoading(false);
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
    "--tw-ring-color": "var(--primary)",
  } as React.CSSProperties;

  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
    >
      <div className="border-b p-4" style={{ borderColor: "var(--border-light)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          커플 연결
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          실험 중인 기능이에요. 연결 후 달력에서 서로의 근무 일정을 함께 볼 수 있습니다.
        </p>
      </div>

      <div className="px-4 pb-4 pt-4">
        {coupleStatus.status === "none" && (
          <>
            <div className="mb-4">
              <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
                내 연결 코드
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-md px-3 py-1.5 text-sm font-mono font-semibold tracking-widest"
                  style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                >
                  {coupleStatus.couple_code}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(coupleStatus.couple_code!)}
                  className="text-xs"
                  style={{ color: "var(--primary)" }}
                >
                  복사
                </button>
              </div>
            </div>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              상대방 코드로 연결
            </p>
            <form onSubmit={handleCoupleRequest} className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2">
              <input
                type="text"
                value={partnerCodeInput}
                onChange={(e) => setPartnerCodeInput(e.target.value)}
                placeholder="상대방 코드 입력"
                maxLength={6}
                className="h-12 min-w-0 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={coupleLoading || !partnerCodeInput.trim()}
                className="interactive-press flex h-12 min-w-20 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium whitespace-nowrap disabled:opacity-50"
                style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
              >
                요청
              </button>
            </form>
            {coupleMessage && (
              <p className="mt-2 text-xs" style={{ color: "var(--error)" }}>
                {coupleMessage}
              </p>
            )}
          </>
        )}

        {coupleStatus.status === "pending_sent" && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--primary)" }}>{coupleStatus.partner_name}</span>님께 연결 요청을 보냈습니다. 수락을 기다리는 중이에요.
            </p>
            <button
              onClick={handleCoupleDelete}
              disabled={coupleLoading}
              className="text-xs disabled:opacity-50"
              style={{ color: "var(--text-muted)" }}
            >
              요청 취소
            </button>
          </div>
        )}

        {coupleStatus.status === "pending_received" && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--primary)" }}>{coupleStatus.partner_name}</span>님이 연결을 요청했습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCoupleAccept}
                disabled={coupleLoading}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
              >
                수락
              </button>
              <button
                onClick={handleCoupleDelete}
                disabled={coupleLoading}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                거절
              </button>
            </div>
          </div>
        )}

        {coupleStatus.status === "accepted" && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              ♥ <span style={{ color: "var(--primary)" }}>{coupleStatus.partner_name}</span>님과 연결되어 있어요. 달력에서 근무 일정을 함께 볼 수 있어요.
            </p>
            <button
              onClick={handleCoupleDelete}
              disabled={coupleLoading}
              className="text-xs disabled:opacity-50"
              style={{ color: "var(--text-muted)" }}
            >
              연결 해제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
