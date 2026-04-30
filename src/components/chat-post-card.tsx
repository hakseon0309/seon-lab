"use client";

import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import { toWorkTerminology } from "@/lib/terminology";
import { formatPostedAt } from "@/lib/time";

interface Props {
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
  teamName: string;
  status: "open" | "done";
}

export default function ChatPostCard({
  title,
  body,
  createdAt,
  authorName,
  authorAvatar,
  teamName,
  status,
}: Props) {
  const displayTitle = toWorkTerminology(title);
  const displayBody = toWorkTerminology(body);

  return (
    <div
      className="mx-4 mt-2 rounded-lg border p-4 lg:mx-0"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      <p
        className="text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {displayTitle}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <AvatarImage
          src={authorAvatar}
          name={authorName}
          sizeClass="h-7 w-7"
        />
        <p
          className="min-w-0 flex-1 truncate text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {authorName} · {teamName} · {formatPostedAt(createdAt)}
        </p>
        <PostStatusBadge status={status} className="shrink-0" />
      </div>

      <p
        className="mt-4 whitespace-pre-wrap text-sm leading-6"
        style={{ color: "var(--text-secondary)" }}
      >
        {displayBody}
      </p>
    </div>
  );
}
