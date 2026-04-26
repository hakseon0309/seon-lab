"use client";

import AvatarImage from "@/components/avatar-image";
import { BoardManagerRecord } from "@/lib/board-managers-client";

interface Props {
  managers: BoardManagerRecord[];
  savingUserId: string | null;
  onRemove: (userId: string) => void;
}

export default function BoardManagersList({
  managers,
  savingUserId,
  onRemove,
}: Props) {
  if (managers.length === 0) {
    return (
      <p
        className="rounded-lg border px-3 py-4 text-center text-sm"
        style={{
          borderColor: "var(--border-light)",
          color: "var(--text-muted)",
        }}
      >
        지정된 관리자가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {managers.map((manager) => (
        <li
          key={manager.user_id}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border-light)" }}
        >
          <AvatarImage
            src={manager.avatar_url}
            name={manager.display_name}
            sizeClass="h-8 w-8"
          />
          <span
            className="min-w-0 flex-1 truncate text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {manager.display_name || "이름 없음"}
          </span>
          <button
            type="button"
            onClick={() => onRemove(manager.user_id)}
            disabled={savingUserId === manager.user_id}
            className="interactive-press text-xs disabled:opacity-50"
            style={{ color: "var(--error)" }}
          >
            해제
          </button>
        </li>
      ))}
    </ul>
  );
}
