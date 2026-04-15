"use client";

import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/nav";
import LoadingScreen from "@/components/loading-screen";
import { useTheme } from "@/lib/theme";
import { CoupleStatus } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [icsUrl, setIcsUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  // 커플
  const [coupleStatus, setCoupleStatus] = useState<CoupleStatus | null>(null);
  const [partnerCodeInput, setPartnerCodeInput] = useState("");
  const [coupleMessage, setCoupleMessage] = useState("");
  const [coupleLoading, setCoupleLoading] = useState(false);
  const [coupleExpanded, setCoupleExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [profileRes, coupleRes] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("id", user.id).single(),
        fetch("/api/couples"),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || "");
        setIcsUrl(profileRes.data.ics_url || "");
        setIsAdmin(!!profileRes.data.is_admin);
      }

      if (coupleRes.ok) {
        const coupleData = await coupleRes.json();
        setCoupleStatus(coupleData);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName.trim(),
        ics_url: icsUrl.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      setMessage("저장에 실패했습니다: " + error.message);
    } else {
      setMessage("저장되었습니다");
      if (icsUrl.trim()) {
        const syncRes = await fetch("/api/sync", { method: "POST" });
        if (syncRes.ok) {
          const data = await syncRes.json();
          setMessage(`저장 완료! ${data.synced}개의 일정이 동기화되었습니다`);
        }
      }
    }

    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleCoupleRequest() {
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
    } else {
      const coupleRes = await fetch("/api/couples");
      if (coupleRes.ok) setCoupleStatus(await coupleRes.json());
      setPartnerCodeInput("");
    }
    setCoupleLoading(false);
  }

  async function handleCoupleAccept() {
    if (!coupleStatus?.request_id) return;
    setCoupleLoading(true);
    await fetch(`/api/couples/${coupleStatus.request_id}`, { method: "PATCH" });
    const res = await fetch("/api/couples");
    if (res.ok) setCoupleStatus(await res.json());
    setCoupleLoading(false);
  }

  async function handleCoupleDelete() {
    if (!coupleStatus?.request_id) return;
    setCoupleLoading(true);
    await fetch(`/api/couples/${coupleStatus.request_id}`, { method: "DELETE" });
    setCoupleStatus({ couple_code: coupleStatus.couple_code, status: "none", request_id: null, partner_id: null, partner_name: null });
    setCoupleLoading(false);
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
    "--tw-ring-color": "var(--primary)",
  } as React.CSSProperties;

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-lg px-4 py-6 lg:py-8 pb-24 lg:pb-8">
        <h1 className="mb-6 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          설정
        </h1>

        {/* ── 프로필 & URL ── */}
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              이름
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="팀에서 보일 이름"
            />
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              캘린더 구독 URL
            </label>
            <input
              type="url"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="webcal://... 또는 https://..."
            />
          </div>

          {message && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                backgroundColor: message.includes("실패") ? "var(--error-bg)" : "var(--success-bg)",
                color: message.includes("실패") ? "var(--error)" : "var(--success)",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </form>

        {/* ── 커플 연결 ── */}
        {coupleStatus && (
          <div
            className="mt-8 rounded-lg border"
            style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
          >
            <button
              type="button"
              onClick={() => setCoupleExpanded((v) => !v)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                커플 연결
                {coupleStatus.status === "accepted" && (
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    ♥ {coupleStatus.partner_name}
                  </span>
                )}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {coupleExpanded ? "▲" : "▼"}
              </span>
            </button>
            {coupleExpanded && (
            <div className="border-t px-4 pb-4 pt-4" style={{ borderColor: "var(--border-light)" }}>

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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value)}
                    placeholder="상대방 코드 입력"
                    maxLength={6}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={inputStyle}
                  />
                  <button
                    onClick={handleCoupleRequest}
                    disabled={coupleLoading || !partnerCodeInput.trim()}
                    className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
                  >
                    요청
                  </button>
                </div>
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
                  ♥ <span style={{ color: "var(--primary)" }}>{coupleStatus.partner_name}</span>님과 연결되어 있어요. 달력에서 시프트를 함께 볼 수 있어요.
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
            )}
          </div>
        )}

        {/* ── 테마 ── */}
        <button
          onClick={toggle}
          className="mt-8 flex w-full items-center justify-between rounded-lg border p-4 text-left"
          style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {theme === "light" ? "라이트 모드" : "다크 모드"}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {theme === "light" ? "🌙" : "☀️"}
          </span>
        </button>

        {/* ── 관리자 ── */}
        {isAdmin && (
          <button
            onClick={() => router.push("/admin")}
            className="mt-4 w-full rounded-lg border p-4 text-left text-sm font-medium"
            style={{
              borderColor: "var(--border-light)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
          >
            관리자 페이지
          </button>
        )}

        {/* ── 로그아웃 ── */}
        <div
          className="mt-4 rounded-lg border p-4"
          style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
        >
          <button
            onClick={handleLogout}
            className="w-full text-sm font-medium"
            style={{ color: "var(--error)" }}
          >
            로그아웃
          </button>
        </div>

        {/* ── 홈 화면 추가 안내 ── */}
        {!isStandalone && (
          <div
            className="mt-8 rounded-lg border p-4"
            style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
          >
            <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              홈 화면에 추가하는 방법
            </h2>
            <ol className="space-y-2.5">
              {[
                { step: "1", text: "아이폰 Safari에서 이 페이지를 열어주세요" },
                { step: "2", text: "하단 공유 버튼을 탭하세요" },
                { step: "3", text: "스크롤을 내려 홈 화면에 추가를 탭하세요" },
                { step: "4", text: "오른쪽 상단 추가를 탭하면 완료입니다" },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "var(--event-bg)", color: "var(--event-text)" }}
                  >
                    {step}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {text}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              홈 화면에 추가하면 앱처럼 전체 화면으로 사용할 수 있어요
            </p>
          </div>
        )}
      </main>
    </>
  );
}
