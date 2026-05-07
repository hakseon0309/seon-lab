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
  variant = "compact",
}: {
  post: SwapPost;
  showStatus?: boolean;
  variant?: "compact" | "detail";
}) {
  const summary = buildSwapSummaryFromPost(post);
  const teamLabel = post.team_names?.join(", ") || post.team_name || "알 수 없는 팀";

  return (
    <div className="space-y-2">
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
        {showStatus && (
          <PostStatusBadge
            status={post.swap_status}
            className="ml-auto shrink-0"
          />
        )}
      </div>

      {variant === "detail" ? (
        <DetailSummary summary={summary} />
      ) : (
        <CompactSummary summary={summary} />
      )}
    </div>
  );
}

function CompactSummary({ summary }: { summary: ReturnType<typeof buildSwapSummaryFromPost> }) {
  return (
    <div className="space-y-2">
      <div className="grid min-w-0 grid-cols-[max-content_max-content_minmax(0,1fr)] items-center gap-x-1.5 gap-y-1.5">
        <CompactSummaryRow row={summary.mine} />
        <CompactSummaryRow row={summary.target} />
      </div>
      {summary.note && (
        <p
          className="truncate px-2 text-xs leading-5"
          style={{ color: "var(--text-secondary)" }}
        >
          &quot;{summary.note}&quot;
        </p>
      )}
    </div>
  );
}

function DetailSummary({
  summary,
}: {
  summary: ReturnType<typeof buildSwapSummaryFromPost>;
}) {
  return (
    <div className="space-y-2">
      <div className="grid min-w-0 grid-cols-[max-content_max-content_minmax(0,1fr)] items-start gap-x-1.5 gap-y-1.5">
        <DetailSummaryRow row={summary.mine} />
        <DetailSummaryRow row={summary.target} />
      </div>
      {summary.note && (
        <p
          className="px-2 text-xs leading-5"
          style={{ color: "var(--text-secondary)" }}
        >
          &quot;{summary.note}&quot;
        </p>
      )}
    </div>
  );
}

function DetailSummaryRow({ row }: { row: SwapSummaryRow }) {
  const values =
    row.displayMode === "scheduleFlow" ? row.values : row.values.filter((value) => value !== "→");
  const displayValues = row.secondary ? [...values, row.secondary] : values;

  return (
    <>
      <CompactToken tone={row.tone === "target" ? "target" : "neutral"}>
        {row.label}
      </CompactToken>
      <CompactToken tone="plain">{row.date}</CompactToken>
      <div
        className={`flex min-w-0 max-w-full gap-1.5 ${
          row.displayMode === "scheduleFlow"
            ? "flex-wrap items-center"
            : "flex-col items-start"
        }`}
      >
        {displayValues.map((value, index) =>
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
              tone={detailValueTone(value, row)}
              className={isTimeRangeValue(value) ? "tabular-nums" : ""}
              truncate={false}
            >
              {value}
            </CompactToken>
          )
        )}
      </div>
    </>
  );
}

function detailValueTone(
  value: string,
  row: SwapSummaryRow
): "targetSoft" | "plain" | "off" {
  if (value === "휴무") return "off";
  return row.tone === "target" ? "targetSoft" : "plain";
}

function isTimeRangeValue(value: string) {
  return /\d{2}:\d{2}/.test(value);
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
  truncate = true,
}: {
  children: string;
  tone: "neutral" | "target" | "targetSoft" | "plain" | "off";
  className?: string;
  truncate?: boolean;
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
      className={`inline-flex min-h-7 shrink-0 items-center rounded-md border px-2 py-1 text-[11px] font-semibold leading-tight ${
        truncate ? "max-w-full" : ""
      } ${className}`}
      style={styles}
    >
      <span className={truncate ? "truncate" : "whitespace-nowrap"}>
        {children}
      </span>
    </span>
  );
}

export default memo(SwapPostTitleCard);
