type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status: number };

type JsonRecord = Record<string, unknown>;

async function requestAdminApi<T>(
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

export function addAdminUserToTeam(userId: string, teamId: string) {
  return requestAdminApi<{ success: true }>("/api/admin/team-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, team_id: teamId }),
  });
}

export function removeAdminUserFromTeam(userId: string, teamId: string) {
  return requestAdminApi<{ success: true }>("/api/admin/team-members", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, team_id: teamId }),
  });
}

export function updateAdminCorpTeam(teamId: string, isCorpTeam: boolean) {
  return requestAdminApi<{ success: true }>("/api/admin/teams", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_id: teamId, is_corp_team: isCorpTeam }),
  });
}

export function syncAllAdminUsers() {
  return requestAdminApi<{ synced: number; failed: number; total: number }>(
    "/api/admin/sync-all",
    { method: "POST" }
  );
}
