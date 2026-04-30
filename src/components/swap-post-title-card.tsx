"use client";

import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import {
  buildSwapSummaryFromPost,
  SwapSummaryRow,
} from "@/lib/swap-board";
import { formatPostedAt } from "@/lib/time";
import { SwapPost } from "@/lib/types";
import { memo } from "react";

function SwapPostTitleCard({
  post,
  showStatus = true,
}: {
  post: SwapPost;
  showStatus?: boolean;
}) {
  const summary = buildSwapSummaryFromPost(post);
  const teamLabel = post.team_names?.join(", ") || post.team_name || "알 수 없는 팀";

  return (
    <div className={`relative space-y-2 ${showStatus ? "pr-[4.75rem]" : ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        <AvatarImage
          src={post.author_avatar_url ?? null}
          name={post.author_name || "이름 없음"}
          sizeClass="h-7 w-7"
          textClass="text-[10px]"
        />
        <p
          className="min-w-0 flex-1 truncate text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {post.author_name || "이름 없음"}
          </span>
          <span> · {teamLabel} · {formatPostedAt(post.created_at)}</span>
        </p>
      </div>

      {showStatus && (
        <PostStatusBadge
          status={post.swap_status}
          className="absolute right-0 top-0"
        />
      )}

      <div className="space-y-1.5">
        <div className="grid min-w-0 grid-cols-[max-content_max-content_minmax(0,1fr)] items-center gap-x-1.5 gap-y-1.5">
          <CompactSummaryRow row={summary.mine} />
          <CompactSummaryRow row={summary.target} />
        </div>
        {summary.note && (
          <p
            className="truncate rounded-md px-2 py-1 text-xs"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
            }}
          >
            &quot;{summary.note}&quot;
          </p>
        )}
      </div>
    </div>
  );
}

function CompactSummaryRow({ row }: { row: SwapSummaryRow }) {
  const showSingleTargetShift =
    row.displayMode === "shiftOptions" && row.values.length > 1;
  const visibleCount =
    row.displayMode === "scheduleFlow"
      ? row.values.length
      : showSingleTargetShift
        ? 1
        : 2;
  const visibleValues = row.values.slice(0, visibleCount);
  const hasMore = row.values.length > visibleValues.length;
  const hiddenCount = row.values.length - visibleValues.length;

  return (
    <>
      <CompactToken tone={row.tone === "target" ? "target" : "neutral"}>
        {row.label}
      </CompactToken>
      <CompactToken tone="plain">{row.date}</CompactToken>
      <div
        className={`flex min-w-0 items-center gap-1.5 ${
          row.displayMode === "scheduleFlow"
            ? "overflow-visible whitespace-nowrap"
            : "overflow-visible"
        }`}
      >
        {visibleValues.map((value, index) => (
          value === "→" ? (
            <span
              key={`${row.label}-${value}-${index}`}
              className="shrink-0 text-sm font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              {value}
            </span>
          ) : (
            <CompactToken
              key={`${row.label}-${value}-${index}`}
              tone={
                value === "휴무"
                  ? "off"
                  : row.tone === "target"
                    ? "targetSoft"
                    : "plain"
              }
            >
              {value}
            </CompactToken>
          )
        ))}
        {row.secondary && (
          <CompactToken tone="plain">{row.secondary}</CompactToken>
        )}
        {hasMore && (
          <CompactToken
            tone={row.tone === "target" ? "targetSoft" : "plain"}
            className="shrink-0"
          >
            {`+${hiddenCount}`}
          </CompactToken>
        )}
      </div>
    </>
  );
}

function CompactToken({
  children,
  tone,
  className = "",
}: {
  children: string;
  tone: "neutral" | "target" | "targetSoft" | "plain" | "off";
  className?: string;
}) {
  const styles = {
    neutral: {
      borderColor: "var(--border-light)",
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-secondary)",
    },
    target: {
      borderColor: "transparent",
      backgroundColor: "var(--secondary-light)",
      color: "var(--secondary)",
    },
    targetSoft: {
      borderColor: "transparent",
      backgroundColor: "var(--secondary-light)",
      color: "var(--secondary)",
    },
    plain: {
      borderColor: "var(--border-light)",
      backgroundColor: "var(--bg-card)",
      color: "var(--text-primary)",
    },
    off: {
      borderColor: "var(--border-light)",
      backgroundColor: "var(--bg-muted)",
      color: "var(--text-secondary)",
    },
  }[tone];

  return (
    <span
      className={`inline-flex min-h-7 max-w-full shrink-0 items-center rounded-md border px-2 py-1 text-[11px] font-semibold leading-tight ${className}`}
      style={styles}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

export default memo(SwapPostTitleCard);
