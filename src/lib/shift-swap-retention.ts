export const COMPLETED_SWAP_POST_RETENTION_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function getCompletedSwapPostExpiryCutoff(now = new Date()) {
  return new Date(
    now.getTime() - COMPLETED_SWAP_POST_RETENTION_DAYS * DAY_MS
  ).toISOString();
}

export function isExpiredCompletedSwapPost(
  post: { swap_status?: string | null; completed_at?: string | null },
  now = new Date()
) {
  if (post.swap_status !== "done" || !post.completed_at) return false;

  const completedAt = new Date(post.completed_at).getTime();
  if (!Number.isFinite(completedAt)) return false;

  return (
    completedAt <=
    now.getTime() - COMPLETED_SWAP_POST_RETENTION_DAYS * DAY_MS
  );
}
