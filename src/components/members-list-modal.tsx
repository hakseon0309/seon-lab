"use client";

import Modal from "@/components/modal";
import { UserProfile } from "@/lib/types";

interface MemberItem {
  profile: UserProfile;
  joinedAt: string | null;
}

interface Props {
  members: MemberItem[];
  leaderId: string;
  onClose: () => void;
  onSelectMember: (member: MemberItem) => void;
}

export default function MembersListModal({ members, leaderId, onClose, onSelectMember }: Props) {
  return (
    <Modal title={`팀원 (${members.length}명)`} onClose={onClose}>
      <div className="max-h-[60vh] overflow-y-auto space-y-2 -mx-2 px-2">
        {members.map((member) => (
          <button
            key={member.profile.id}
            onClick={() => onSelectMember(member)}
            className="interactive-press flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left"
            style={{
              borderColor: "var(--border-light)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              상세 →
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
