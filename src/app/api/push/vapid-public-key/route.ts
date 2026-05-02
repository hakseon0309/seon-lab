import { NextResponse } from "next/server";
import { getWebPushPublicKey } from "@/lib/push-server";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getWebPushPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: "푸시 알림 서버 설정이 필요합니다" },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
