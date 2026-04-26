"use client";

import AvatarImage from "@/components/avatar-image";
import {
  BoardManagerRecord,
  BoardManagerSearchResult,
} from "@/lib/board-managers-client";

interface Props {
  query: string;
  searching: boolean;
  results: BoardManagerSearchResult[];
  managers: BoardManagerRecord[];
  savingUserId: string | null;
  onAdd: (userId: string) => void;
}

export default function BoardManagerSearchResults({
  query,
  searching,
  results,
  managers,
  savingUserId,
  onAdd,
}: Props) {
  return (
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
        results.map((user) => {
          const already = managers.some((manager) => manager.user_id === user.id);
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => !already && onAdd(user.id)}
              disabled={already || savingUserId === user.id}
              className="interactive-press flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left disabled:opacity-50"
            >
              <AvatarImage
                src={user.avatar_url}
                name={user.display_name}
                sizeClass="h-8 w-8"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.display_name || "이름 없음"}
                </p>
                {user.email && (
                  <p
                    className="truncate text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {user.email}
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
  );
}
