"use client";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status: number };

type JsonRecord = Record<string, unknown>;

export interface BoardManagerRecord {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface BoardManagerSearchResult {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
}

async function requestBoardManagerApi<T>(
  input: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, init);
    const data = (await response.json().catch(() => ({}))) as JsonRecord;

    if (!response.ok) {
      return {
        ok: false,
        error:
          typeof data.error === "string"
            ? data.error
            : "요청 처리에 실패했습니다",
        code: typeof data.code === "string" ? data.code : undefined,
        status: response.status,
      };
    }

    return { ok: true, data: data as T };
  } catch {
    return {
      ok: false,
      error: "네트워크 요청에 실패했습니다",
      code: "network_error",
      status: 0,
    };
  }
}

export function loadBoardManagers(boardId: string) {
  return requestBoardManagerApi<{ managers: BoardManagerRecord[] }>(
    `/api/boards/${boardId}/managers`
  );
}

export function searchBoardManagerCandidates(query: string, signal?: AbortSignal) {
  return fetch(`/api/users/search?q=${encodeURIComponent(query)}`, { signal })
    .then(async (response) => {
      const data = (await response.json().catch(() => ({ users: [] }))) as {
        users?: BoardManagerSearchResult[];
      };
      return data.users ?? [];
    });
}

export function addBoardManager(boardId: string, userId: string) {
  return requestBoardManagerApi<{ manager: BoardManagerRecord }>(
    `/api/boards/${boardId}/managers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    }
  );
}

export function removeBoardManager(boardId: string, userId: string) {
  return requestBoardManagerApi<{ success: true }>(
    `/api/boards/${boardId}/managers?user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
}
