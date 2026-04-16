"use client";

import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/nav";
import LoadingScreen from "@/components/loading-screen";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [icsUrl, setIcsUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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

      const profileRes = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || "");
        setIcsUrl(profileRes.data.ics_url || "");
        setIsAdmin(!!profileRes.data.is_admin);
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
    if (!user) {
      setSaving(false);
      return;
    }

    const nextDisplayName = displayName.trim();
    const nextIcsUrl = icsUrl.trim() || null;

    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update({
        display_name: nextDisplayName,
        ics_url: nextIcsUrl,
      })
      .eq("id", user.id)
      .select("display_name, ics_url")
      .single();

    if (error || !updatedProfile) {
      setMessage("저장에 실패했습니다: " + (error?.message || "프로필을 찾을 수 없습니다"));
    } else {
      setDisplayName(updatedProfile.display_name || "");
      setIcsUrl(updatedProfile.ics_url || "");

      await supabase.auth.updateUser({
        data: {
          display_name: updatedProfile.display_name,
        },
      });

      setMessage("저장되었습니다");
      if (updatedProfile.ics_url) {
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
      <main className="mx-auto w-full max-w-lg py-6 pb-24 lg:py-8 lg:pb-8">
        <div className="px-4 lg:px-0">
          <div className="page-title-block">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              설정
            </h1>
          </div>

          <div className="page-stack">
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
                placeholder="https://sm-cal.apple.com/cal/..."
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

            <button
              onClick={() => router.push("/settings/beta")}
              className="flex w-full items-center justify-between rounded-lg border p-4 text-left"
              style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
            >
              <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                실험적 기능
              </span>
            </button>

            {/* ── 테마 ── */}
            <button
              onClick={toggle}
              className="flex w-full items-center justify-between rounded-lg border p-4 text-left"
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
                className="w-full rounded-lg border p-4 text-left text-sm font-medium"
                style={{
                  borderColor: "var(--border-light)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                }}
              >
                관리자 페이지
              </button>
            )}

            {/* ── 홈 화면 추가 안내 ── */}
            {!isStandalone && (
              <div>
                <button
                  onClick={() => setShowInstallGuide((prev) => !prev)}
                  className="flex w-full items-center rounded-lg border p-4 text-left"
                  style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    홈 화면에 추가
                  </span>
                </button>

                {showInstallGuide && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={() => setShowInstallGuide(false)}
                  >
                    <div
                      className="w-full max-w-sm rounded-2xl border p-5"
                      style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          홈 화면에 추가
                        </h2>
                        <button
                          onClick={() => setShowInstallGuide(false)}
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          닫기
                        </button>
                      </div>

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
                      <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        홈 화면에 추가하면 앱처럼 전체 화면으로 사용할 수 있어요
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 로그아웃 ── */}
            <div
              className="rounded-lg border p-4"
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
          </div>
        </div>
      </main>
    </>
  );
}
