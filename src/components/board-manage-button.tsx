"use client";

import Modal from "@/components/modal";
import AvatarImage from "@/components/avatar-image";
import { useToast } from "@/components/toast-provider";
import { useEffect, useState } from "react";

interface Manager {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface SearchResult {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
}

export default function BoardManageButton({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch(`/api/boards/${boardId}/managers`);
      const data = await res.json().catch(() => ({ managers: [] }));
      setManagers(data.managers ?? []);
    })();
  }, [open, boardId]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        const data = await res.json().catch(() => ({ users: [] }));
        setResults(data.users ?? []);
      } catch {
        // aborted
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  async function addManager(userId: string) {
    setSaving(userId);
    const res = await fetch(`/api/boards/${boardId}/managers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) {
      toast.error(data.error || "관리자 임명에 실패했습니다");
      return;
    }
    setManagers((prev) =>
      prev.some((m) => m.user_id === userId) ? prev : [...prev, data.manager]
    );
    toast.success("게시판 관리자를 임명했습니다");
    setQuery("");
    setResults([]);
  }

  async function removeManager(userId: string) {
    setSaving(userId);
    const res = await fetch(
      `/api/boards/${boardId}/managers?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    const data = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) {
      toast.error(data.error || "해제에 실패했습니다");
      return;
    }
    setManagers((prev) => prev.filter((m) => m.user_id !== userId));
    toast.success("관리자 권한을 해제했습니다");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="interactive-press rounded-md px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: "var(--button-surface)",
          color: "var(--text-primary)",
        }}
      >
        관리
      </button>

      {open && (
        <Modal
          title="게시판 관리자"
          onClose={() => setOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            <div>
              <p
                className="mb-2 text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                현재 관리자
              </p>
              {managers.length === 0 ? (
                <p
                  className="rounded-lg border px-3 py-4 text-center text-sm"
                  style={{
                    borderColor: "var(--border-light)",
                    color: "var(--text-muted)",
                  }}
                >
                  지정된 관리자가 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {managers.map((m) => (
                    <li
                      key={m.user_id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2"
                      style={{ borderColor: "var(--border-light)" }}
                    >
                      <AvatarImage
                        src={m.avatar_url}
                        name={m.display_name}
                        sizeClass="h-8 w-8"
                      />
                      <span
                        className="min-w-0 flex-1 truncate text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {m.display_name || "이름 없음"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeManager(m.user_id)}
                        disabled={saving === m.user_id}
                        className="interactive-press text-xs disabled:opacity-50"
                        style={{ color: "var(--error)" }}
                      >
                        해제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p
                className="mb-2 text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                팀원 추가
              </p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 이메일로 검색"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={
                  {
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                    "--tw-ring-color": "var(--primary)",
                  } as React.CSSProperties
                }
              />
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                {query.trim().length === 0 ? (
                  <p
                    className="py-4 text-center text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    검색어를 입력하세요.
                  </p>
                ) : searching ? (
                  <p
                    className="py-4 text-center text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    검색 중…
                  </p>
                ) : results.length === 0 ? (
                  <p
                    className="py-4 text-center text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    일치하는 팀원가 없습니다.
                  </p>
                ) : (
                  results.map((u) => {
                    const already = managers.some((m) => m.user_id === u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => !already && addManager(u.id)}
                        disabled={already || saving === u.id}
                        className="interactive-press flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left disabled:opacity-50"
                      >
                        <AvatarImage
                          src={u.avatar_url}
                          name={u.display_name}
                          sizeClass="h-8 w-8"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {u.display_name || "이름 없음"}
                          </p>
                          {u.email && (
                            <p
                              className="truncate text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {u.email}
                            </p>
                          )}
                        </div>
                        {already && (
                          <span
                            className="shrink-0 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            이미 관리자
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
