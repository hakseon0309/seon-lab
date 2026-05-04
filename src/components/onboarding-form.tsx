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

  async function finishOnboarding(event?: React.FormEvent) {
    event?.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("이름을 입력해주세요");
      return;
    }
    setDisplayName(name);
    setSaving(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: name,
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
    router.replace("/onboarding/install-guide");
    router.refresh();
  }

  return (
    <div>
      <form
        onSubmit={finishOnboarding}
        className="space-y-5 rounded-lg border p-4"
        style={{
          borderColor: "var(--border-light)",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <ProfileAvatarControl
          initialAvatarUrl={initialAvatarUrl}
          displayName={displayName}
          compact
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

        {teamNames.length > 0 && (
          <div>
            <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              가입할 팀
            </h2>
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              여러 팀을 함께 선택할 수 있습니다.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
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
          </div>
        )}

        {error && (
          <p className="rounded-lg p-3 text-sm" style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="interactive-press w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          확인
        </button>
      </form>
    </div>
  );
}
