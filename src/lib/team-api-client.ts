import { Team } from "@/lib/types";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status: number };

type JsonRecord = Record<string, unknown>;

async function requestTeamApi<T>(
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

export function renameTeam(teamId: string, name: string) {
  return requestTeamApi<Team>(`/api/teams/${teamId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function removeTeamMember(teamId: string, userId: string) {
  return requestTeamApi<{ success: true }>(`/api/teams/${teamId}/members`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export function transferTeamOwnership(teamId: string, newOwnerId: string) {
  return requestTeamApi<{ success: true }>(`/api/teams/${teamId}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_owner_id: newOwnerId }),
  });
}

export function setTeamFavorite(teamId: string, favorite: boolean) {
  return requestTeamApi<{ ok?: true }>(`/api/teams/${teamId}/favorite`, {
    method: favorite ? "POST" : "DELETE",
  });
}

export function setTeamScheduleSharing(teamId: string, shareSchedule: boolean) {
  return requestTeamApi<{ team_id: string; share_schedule: boolean }>(
    `/api/teams/${teamId}/share-schedule`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ share_schedule: shareSchedule }),
    }
  );
}
