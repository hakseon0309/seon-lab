import { CSSProperties } from "react";

// 피드백 게시판 상태
export type FeedbackStatus = "requested" | "accepted" | "resolved";
// 근무 교환 게시판 상태
export type SwapStatus = "open" | "done";

type Status = FeedbackStatus | SwapStatus;

interface Props {
  status: Status;
  className?: string;
}

const LABEL: Record<Status, string> = {
  requested: "요청됨",
  accepted: "접수됨",
  resolved: "해결됨",
  open: "진행중",
  done: "완료됨",
};

function styleFor(status: Status): CSSProperties {
  switch (status) {
    case "resolved":
    case "done":
      return { backgroundColor: "var(--success-bg)", color: "var(--success)" };
    case "accepted":
    case "open":
      return { backgroundColor: "var(--event-bg)", color: "var(--event-text)" };
    case "requested":
    default:
      return {
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-secondary)",
      };
  }
}

export default function PostStatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${className}`}
      style={styleFor(status)}
    >
      {LABEL[status]}
    </span>
  );
}
