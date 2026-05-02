import { NextResponse } from "next/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function parseSubscription(body: SubscriptionBody) {
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return apiErrors.unauthorized();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return apiError(503, "푸시 알림 서버 설정이 필요합니다");
  }

  const parsed = await parseJsonBody<SubscriptionBody>(request);
  if (!parsed.ok) return parsed.response;

  const subscription = parseSubscription(parsed.body);
  if (!subscription) return apiErrors.badRequest("구독 정보가 올바르지 않습니다");

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      user_agent: request.headers.get("user-agent"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) return apiError(500, error.message);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return apiErrors.unauthorized();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return apiError(503, "푸시 알림 서버 설정이 필요합니다");
  }

  const parsed = await parseJsonBody<{ endpoint?: unknown }>(request);
  if (!parsed.ok) return parsed.response;

  const endpoint =
    typeof parsed.body.endpoint === "string" ? parsed.body.endpoint : "";
  if (!endpoint) return apiErrors.badRequest("구독 정보가 올바르지 않습니다");

  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) return apiError(500, error.message);
  return NextResponse.json({ success: true });
}
