export function mapOAuthErrorToKorean(code: string | null | undefined): string {
  if (!code) return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요";
  const key = code.toLowerCase();
  switch (key) {
    case "access_denied":
      return "로그인이 취소되었습니다";
    case "invalid_grant":
    case "expired_token":
      return "인증이 만료되었습니다. 다시 시도해주세요";
    case "server_error":
    case "temporarily_unavailable":
      return "로그인 서버에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요";
    case "invalid_request":
    case "unauthorized_client":
    case "unsupported_response_type":
    case "invalid_scope":
      return "로그인 설정에 문제가 있어요. 관리자에게 알려주세요";
    default:
      return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요";
  }
}
