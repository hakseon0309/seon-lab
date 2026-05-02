"use client";

import ProfileAvatarControl from "@/components/profile-avatar-control";
import { requestCalendarSync } from "@/lib/calendar-sync-client";
import { useRouteTransition } from "@/components/route-transition-provider";
import { useToast } from "@/components/toast-provider";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface Props {
  initialDisplayName: string;
  initialIcsUrl: string;
  initialAvatarUrl: string | null;
  teamNames: string[];
}

export default function OnboardingForm({
  initialDisplayName,
  initialIcsUrl,
  initialAvatarUrl,
  teamNames,
}: Props) {
  const [step, setStep] = useState<"profile" | "teams">("profile");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [icsUrl, setIcsUrl] = useState(initialIcsUrl);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  const { startNavigation } = useRouteTransition();

  const inputStyle = useMemo(
    () =>
      ({
        backgroundColor: "var(--input-bg)",
        borderColor: "var(--input-border)",
        color: "var(--input-text)",
        "--tw-ring-color": "var(--primary)",
      }) as React.CSSProperties,
    []
  );

  function toggleTeam(teamName: string) {
    setSelectedTeams((prev) =>
      prev.includes(teamName)
        ? prev.filter((name) => name !== teamName)
        : [...prev, teamName]
    );
  }

  function goToTeams(event: React.FormEvent) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("이름을 입력해주세요");
      return;
    }
    setDisplayName(name);
    setError("");
    setStep("teams");
  }

  async function finishOnboarding() {
    setSaving(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        ics_url: icsUrl,
        team_names: selectedTeams,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "처음 설정을 저장하지 못했습니다"
      );
      setSaving(false);
      return;
    }

    if (icsUrl.trim()) {
      toast.info("캘린더를 불러오는 중입니다");
      const sync = await requestCalendarSync();
      if (!sync.ok && sync.code !== "cooldown") {
        toast.error(sync.error || "캘린더 동기화에 실패했습니다");
      }
    }

    startNavigation();
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="page-stack">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          처음 설정
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          근무 일정을 보기 전에 기본 정보를 정해주세요.
        </p>
      </header>

      {step === "profile" ? (
        <form
          onSubmit={goToTeams}
          className="space-y-5 rounded-lg border p-4"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <ProfileAvatarControl
            initialAvatarUrl={initialAvatarUrl}
            displayName={displayName}
          />

          <div>
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              이름
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2"
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
              onChange={(event) => setIcsUrl(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="https://sm-cal.apple.com/cal/..."
            />
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              URL을 아직 모른다면 비워두고 나중에 설정에서 입력해도 괜찮아요.
            </p>
          </div>

          {error && (
            <p className="rounded-lg p-3 text-sm" style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="interactive-press w-full rounded-lg px-4 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            확인
          </button>
        </form>
      ) : (
        <section
          className="space-y-5 rounded-lg border p-4"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              팀 선택
            </h2>
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              가입하지 않아도 되고, 여러 팀을 함께 선택해도 됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {teamNames.map((teamName) => {
              const selected = selectedTeams.includes(teamName);
              return (
                <button
                  key={teamName}
                  type="button"
                  onClick={() => toggleTeam(teamName)}
                  className="interactive-press rounded-lg border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: selected ? "var(--primary)" : "var(--border-light)",
                    backgroundColor: selected ? "var(--primary-light)" : "var(--bg-surface)",
                    color: "var(--text-primary)",
                  }}
                  aria-pressed={selected}
                >
                  {teamName}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="rounded-lg p-3 text-sm" style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("profile")}
              disabled={saving}
              className="interactive-press flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              이전
            </button>
            <button
              type="button"
              onClick={finishOnboarding}
              disabled={saving}
              className="interactive-press flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-on-primary)",
              }}
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
