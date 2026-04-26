"use client";

import ConfirmModal from "@/components/confirm-modal";
import MemberDetailSection from "@/components/member-detail-section";
import MembersListSection from "@/components/members-list-section";
import Modal from "@/components/modal";
import { LABEL } from "@/lib/labels";
import { TeamMemberItem } from "@/lib/team-types";
import { useMemo, useState } from "react";

interface Props {
  members: TeamMemberItem[];
  leaderId: string;
  isLeader: boolean;
  currentUserId: string;
  returnToListOnDetailClose?: boolean;
  onClose: () => void;
  onTransferOwnership: (userId: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  initialSelectedId?: string | null;
}

/**
 * 팀원 리스트 + 팀원 상세를 같은 Modal 안에서 전환한다.
 * 두 개의 Modal 을 번갈아 mount/unmount 하면 그 사이에 portal 백드롭이
 * 순간적으로 사라졌다가 다시 나타나 화면이 깜빡이는 현상이 발생하므로,
 * Modal 을 절대 갈아끼우지 말고 이 컴포넌트 하나가 두 모드를 모두 담당한다.
 */
export default function MembersListModal({
  members,
  leaderId,
  isLeader,
  currentUserId,
  returnToListOnDetailClose = true,
  onClose,
  onTransferOwnership,
  onRemoveMember,
  initialSelectedId = null,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [confirming, setConfirming] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.profile.id, member])),
    [members]
  );
  const selected = selectedId ? memberMap.get(selectedId) ?? null : null;

  async function handleRemove() {
    if (!selected || !onRemoveMember) return;
    setLoading(true);
    setError("");
    try {
      await onRemoveMember(selected.profile.id);
      setShowRemoveConfirm(false);
      setSelectedId(null);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${LABEL.member} 제거에 실패했습니다`
      );
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await onTransferOwnership(selected.profile.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "팀장 위임에 실패했습니다"
      );
      setLoading(false);
      setConfirming(false);
    }
  }

  function closeAll() {
    setSelectedId(null);
    setConfirming(false);
    setShowRemoveConfirm(false);
    setError("");
    onClose();
  }

  function backToList() {
    setSelectedId(null);
    setConfirming(false);
    setShowRemoveConfirm(false);
    setError("");
  }

  const title = selected
    ? `${LABEL.member} 정보`
    : `${LABEL.member} (${members.length}명)`;

  return (
    <Modal
      title={title}
      onClose={selected && returnToListOnDetailClose ? backToList : closeAll}
    >
      {selected ? (
        <MemberDetailSection
          member={selected}
          isLeader={isLeader}
          currentUserId={currentUserId}
          loading={loading}
          confirming={confirming}
          error={error}
          onStartConfirm={() => setConfirming(true)}
          onCancelConfirm={() => setConfirming(false)}
          onConfirmTransfer={handleConfirm}
          onStartRemoveConfirm={() => setShowRemoveConfirm(true)}
          onHasRemove={Boolean(onRemoveMember)}
        />
      ) : (
        <MembersListSection
          members={members}
          leaderId={leaderId}
          onSelect={setSelectedId}
        />
      )}

      {selected && showRemoveConfirm && (
        <ConfirmModal
          title={`${LABEL.member} 제거`}
          description={`${selected.profile.display_name}님을 팀에서 제거할까요?`}
          confirmLabel="제거하기"
          destructive
          loading={loading}
          onClose={() => setShowRemoveConfirm(false)}
          onConfirm={handleRemove}
        />
      )}
    </Modal>
  );
}
