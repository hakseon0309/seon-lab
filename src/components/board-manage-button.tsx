"use client";

import BoardManagerSearchResults from "@/components/board-manager-search-results";
import BoardManagersList from "@/components/board-managers-list";
import Modal from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import {
  addBoardManager,
  BoardManagerRecord,
  BoardManagerSearchResult,
  loadBoardManagers,
  removeBoardManager,
  searchBoardManagerCandidates,
} from "@/lib/board-managers-client";
import { useEffect, useState } from "react";

export default function BoardManageButton({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<BoardManagerRecord[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BoardManagerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;

    (async () => {
      const result = await loadBoardManagers(boardId);
      if (result.ok) {
        setManagers(result.data.managers ?? []);
      }
    })();
  }, [open, boardId]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchBoardManagerCandidates(
          trimmed,
          controller.signal
        );
        setResults(users);
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

  async function handleAddManager(userId: string) {
    setSaving(userId);
    const result = await addBoardManager(boardId, userId);
    setSaving(null);

    if (!result.ok) {
      toast.error(result.error || "관리자 임명에 실패했습니다");
      return;
    }

    setManagers((prev) =>
      prev.some((manager) => manager.user_id === userId)
        ? prev
        : [...prev, result.data.manager]
    );
    toast.success("게시판 관리자를 임명했습니다");
    setQuery("");
    setResults([]);
  }

  async function handleRemoveManager(userId: string) {
    setSaving(userId);
    const result = await removeBoardManager(boardId, userId);
    setSaving(null);

    if (!result.ok) {
      toast.error(result.error || "해제에 실패했습니다");
      return;
    }

    setManagers((prev) => prev.filter((manager) => manager.user_id !== userId));
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
              <BoardManagersList
                managers={managers}
                savingUserId={saving}
                onRemove={handleRemoveManager}
              />
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
                onChange={(event) => setQuery(event.target.value)}
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
              <BoardManagerSearchResults
                query={query}
                searching={searching}
                results={results}
                managers={managers}
                savingUserId={saving}
                onAdd={handleAddManager}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
