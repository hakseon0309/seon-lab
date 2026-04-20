"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouteTransition } from "@/components/route-transition-provider";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialDisplayName: string;
  initialIcsUrl: string;
  isAdmin: boolean;
}

export default function SettingsForm({
  initialDisplayName,
  initialIcsUrl,
  isAdmin,
}: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [icsUrl, setIcsUrl] = useState(initialIcsUrl);
  const [savingName, setSavingName] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { startNavigation } = useRouteTransition();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsStandalone(e.matches);
    update(mql);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingName(false); return; }

    const { data: updated, error } = await supabase
      .from("user_profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id)
      .select("display_name")
      .single();

    if (!error && updated) {
      setDisplayName(updated.display_name || "");
      await supabase.auth.updateUser({ data: { display_name: updated.display_name } });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
      router.refresh();
    }
    setSavingName(false);
  }

  async function handleSaveUrl(e: React.FormEvent) {
    e.preventDefault();
    setSavingUrl(true);
    setUrlSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingUrl(false); return; }

    const { data: updated, error } = await supabase
      .from("user_profiles")
      .update({ ics_url: icsUrl.trim() || null })
      .eq("id", user.id)
      .select("ics_url")
      .single();

    if (!error && updated) {
      setIcsUrl(updated.ics_url || "");
      if (updated.ics_url) {
        await fetch("/api/sync", { method: "POST" });
      }
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
      router.refresh();
    }
    setSavingUrl(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    startNavigation();
    router.push("/login");
    router.refresh();
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
    "--tw-ring-color": "var(--primary)",
  } as React.CSSProperties;

  return (
    <div className="px-4 lg:px-0">
      <div className="page-stack">
        <div className="space-y-4">
          <form onSubmit={handleSaveName}>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              이름
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                style={inputStyle}
                placeholder="팀에서 보일 이름"
              />
              <button
                type="submit"
                disabled={savingName}
                className="shrink-0 w-14 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
              >
                {savingName ? "···" : nameSaved ? "완료" : "저장"}
              </button>
            </div>
          </form>

          <form onSubmit={handleSaveUrl}>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              캘린더 구독 URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={icsUrl}
                onChange={(e) => setIcsUrl(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                style={inputStyle}
                placeholder="https://sm-cal.apple.com/cal/..."
              />
              <button
                type="submit"
                disabled={savingUrl}
                className="shrink-0 w-14 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--primary)", color: "var(--text-on-primary)" }}
              >
                {savingUrl ? "···" : urlSaved ? "완료" : "저장"}
              </button>
            </div>
          </form>
        </div>

        <button
          onClick={() => {
            startNavigation();
            router.push("/settings/beta");
          }}
          className="flex w-full items-center justify-between rounded-lg border p-4 text-left"
          style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
        >
          <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            실험적 기능
          </span>
        </button>

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

        {isAdmin && (
          <button
            onClick={() => {
              startNavigation();
              router.push("/admin");
            }}
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
  );
}
