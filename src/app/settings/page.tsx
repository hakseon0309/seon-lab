"use client";

import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/nav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [icsUrl, setIcsUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setIcsUrl(data.ics_url || "");
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

      // If URL was set, trigger initial sync
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">설정</h1>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              표시 이름
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="팀에서 보일 이름"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              캘린더 구독 URL
            </label>
            <input
              type="url"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="webcal://... 또는 https://..."
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Apple 캘린더 → 캘린더 우클릭 → 공유 설정 → 공개 캘린더에서 URL을
              복사하세요
            </p>
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                message.includes("실패")
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </form>
      </main>
    </>
  );
}
