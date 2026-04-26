"use client";

import { TeamMemberItem } from "@/lib/team-types";

interface Props {
  members: TeamMemberItem[];
  leaderId: string;
  onSelect: (memberId: string) => void;
}

export default function MembersListSection({
  members,
  leaderId,
  onSelect,
}: Props) {
  return (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto px-2">
      {members.map((member) => (
        <button
          key={member.profile.id}
          onClick={() => onSelect(member.profile.id)}
          className="interactive-press flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {member.profile.display_name}
            </span>
            {member.profile.id === leaderId && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                }}
              >
                팀장
              </span>
            )}
          </div>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
