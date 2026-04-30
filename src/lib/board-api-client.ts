import { BoardComment, BoardMessage, BoardPost } from "@/lib/types";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status: number };

type JsonRecord = Record<string, unknown>;

async function requestBoardApi<T>(
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

export function createBoardPost(
  slug: string,
  payload: {
    title: string;
    body: string;
    isAnonymous: boolean;
  }
) {
  return requestBoardApi<BoardPost>(`/api/boards/${slug}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateBoardPost(
  slug: string,
  postId: string,
  payload: { title: string; body: string }
) {
  return requestBoardApi<BoardPost>(`/api/boards/${slug}/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteBoardPost(slug: string, postId: string) {
  return requestBoardApi<{ success: true }>(`/api/boards/${slug}/posts/${postId}`, {
    method: "DELETE",
  });
}

export function updateBoardPostStatus(
  slug: string,
  postId: string,
  status: "requested" | "accepted" | "resolved"
) {
  return requestBoardApi<{ success: true }>(
    `/api/boards/${slug}/posts/${postId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
}

export function createBoardComment(slug: string, postId: string, body: string) {
  return requestBoardApi<{ comment: BoardComment }>(
    `/api/boards/${slug}/posts/${postId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }
  );
}

export function deleteBoardComment(
  slug: string,
  postId: string,
  commentId: string
) {
  return requestBoardApi<{ success: true }>(
    `/api/boards/${slug}/posts/${postId}/comments?id=${commentId}`,
    {
      method: "DELETE",
    }
  );
}

export function createBoardMessage(slug: string, postId: string, body: string) {
  return requestBoardApi<{ message: BoardMessage }>(
    `/api/boards/${slug}/posts/${postId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }
  );
}

export function loadBoardMessages(slug: string, postId: string) {
  return requestBoardApi<{ messages: BoardMessage[] }>(
    `/api/boards/${slug}/posts/${postId}/messages`
  );
}

export function updateBoardPostCompletion(
  slug: string,
  postId: string,
  status: "open" | "done"
) {
  return requestBoardApi<{ success: true }>(
    `/api/boards/${slug}/posts/${postId}/complete`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
}
