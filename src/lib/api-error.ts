import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  code: string;
  raw?: string;
}

function codeForStatus(status: number): string {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 429:
      return "rate_limited";
    case 500:
      return "server_error";
    default:
      return `http_${status}`;
  }
}

export function apiError(
  status: number,
  message: string,
  code?: string,
  raw?: string
) {
  const body: ApiErrorBody = { error: message, code: code ?? codeForStatus(status) };
  if (raw) body.raw = raw;
  return NextResponse.json(body, { status });
}

export const apiErrors = {
  unauthorized: (raw?: string) =>
    apiError(401, "로그인이 필요합니다", "unauthorized", raw),
  forbidden: (message = "권한이 없습니다", raw?: string) =>
    apiError(403, message, "forbidden", raw),
  notFound: (message = "찾을 수 없습니다", raw?: string) =>
    apiError(404, message, "not_found", raw),
  badRequest: (message = "요청이 올바르지 않습니다", raw?: string) =>
    apiError(400, message, "bad_request", raw),
  invalidBody: (raw?: string) =>
    apiError(400, "요청 형식이 올바르지 않습니다", "invalid_body", raw),
  conflict: (message = "이미 처리된 요청입니다", raw?: string) =>
    apiError(409, message, "conflict", raw),
  server: (message = "서버 오류가 발생했습니다", raw?: string) =>
    apiError(500, message, "server_error", raw),
};

export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  try {
    const body = (await request.json()) as T;
    return { ok: true, body };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { ok: false, response: apiErrors.invalidBody(raw) };
  }
}
