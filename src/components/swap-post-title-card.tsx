"use client";

import AvatarImage from "@/components/avatar-image";
import SwapRequestSummaryCard from "@/components/swap-request-summary-card";
import { buildSwapSummaryFromPost } from "@/lib/swap-board";
import { SwapPost } from "@/lib/types";
import { memo } from "react";

function SwapPostTitleCard({ post }: { post: SwapPost }) {
  const summary = buildSwapSummaryFromPost(post);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
        >
          <AvatarImage
            src={post.author_avatar_url ?? null}
            name={post.author_name || "이름 없음"}
            sizeClass="h-5 w-5"
            textClass="text-[10px]"
          />
          <span className="truncate text-xs font-semibold">
            {post.author_name || "이름 없음"}
          </span>
        </span>
      </div>

      <SwapRequestSummaryCard summary={summary} />
    </div>
  );
}

export default memo(SwapPostTitleCard);
