import { createAdminClient } from "@/lib/supabase/admin";
import webpush, { WebPushError } from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let vapidConfigured = false;

function getVapidConfig() {
  const publicKey =
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) return null;

  return {
    publicKey,
    privateKey,
    subject:
      process.env.WEB_PUSH_VAPID_SUBJECT ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "mailto:admin@seonlab.app",
  };
}

export function getWebPushPublicKey() {
  return getVapidConfig()?.publicKey ?? null;
}

function configureVapid() {
  const config = getVapidConfig();
  if (!config) return false;

  if (!vapidConfigured) {
    webpush.setVapidDetails(
      config.subject,
      config.publicKey,
      config.privateKey
    );
    vapidConfigured = true;
  }

  return true;
}

function isPushExpired(error: unknown) {
  return (
    error instanceof WebPushError &&
    (error.statusCode === 404 || error.statusCode === 410)
  );
}

function previewText(value: string, maxLength = 90) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const targetUserIds = [...new Set(userIds.filter(Boolean))];
  if (targetUserIds.length === 0 || !configureVapid()) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", targetUserIds);

  const rows = (subscriptions ?? []) as PushSubscriptionRow[];
  if (rows.length === 0) return;

  const message = JSON.stringify(payload);
  const expiredIds: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
          },
          message
        );
      } catch (error) {
        if (isPushExpired(error)) expiredIds.push(row.id);
      }
    })
  );

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }
}

export async function notifyShiftSwapPostCreated(params: {
  postId: string;
  title: string;
  authorId: string;
  actorName: string;
  teamIds: string[];
}) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !configureVapid()) return;

  const supabase = createAdminClient();
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id")
    .in("team_id", [...new Set(params.teamIds)])
    .neq("user_id", params.authorId);

  const userIds = ((members ?? []) as { user_id: string }[]).map(
    (member) => member.user_id
  );

  await sendPushToUsers(userIds, {
    title: "새 근무 교환 글",
    body: `${params.actorName} · ${previewText(params.title, 70)}`,
    url: `/boards/shift-swap/${params.postId}`,
    tag: `shift-swap-post-${params.postId}`,
  });
}

export async function notifyShiftSwapMessageCreated(params: {
  postId: string;
  postTitle: string;
  postAuthorId: string | null;
  actorId: string;
  actorName: string;
  body: string;
}) {
  if (!params.postAuthorId || params.postAuthorId === params.actorId) return;

  await sendPushToUsers([params.postAuthorId], {
    title: "내 근무 교환 글에 새 대화",
    body: `${params.actorName} · ${previewText(params.body)}`,
    url: `/boards/shift-swap/${params.postId}`,
    tag: `shift-swap-message-${params.postId}`,
  });
}
