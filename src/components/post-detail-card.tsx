"use client";

import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import { toWorkTerminology } from "@/lib/terminology";
import { formatPostedAt } from "@/lib/time";
import { ReactNode } from "react";

interface Props {
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  body: string;
  status?: "requested" | "accepted" | "resolved" | null;
  showStatusBadge: boolean;
  statusContent?: ReactNode;
}

export default function PostDetailCard({
  authorName,
  authorAvatar,
  createdAt,
  body,
  status,
  showStatusBadge,
  statusContent,
}: Props) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2 pt-2">
        <AvatarImage
          src={authorAvatar}
          name={authorName}
          sizeClass="h-8 w-8"
        />
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {authorName}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          ·
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatPostedAt(createdAt)}
        </span>
      </div>

      {statusContent}

      {showStatusBadge && status && (
        <PostStatusBadge status={status} className="mb-4" />
      )}

      <article>
        <p
          className="whitespace-pre-wrap text-sm leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          {toWorkTerminology(body)}
        </p>
      </article>
    </>
  );
}
