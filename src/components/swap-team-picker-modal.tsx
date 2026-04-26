"use client";

import Modal from "@/components/modal";
import { TeamLite } from "@/lib/types";
import { useState } from "react";

interface Props {
  teams: TeamLite[];
  selectedTeamIds: string[];
  onCancel: () => void;
  onConfirm: (teamIds: string[]) => void;
}

export default function SwapTeamPickerModal({
  teams,
  selectedTeamIds,
  onCancel,
  onConfirm,
}: Props) {
  const [draftTeamIds, setDraftTeamIds] = useState<string[]>(selectedTeamIds);

  function toggleTeam(teamId: string) {
    setDraftTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  }

  return (
    <Modal title="팀 선택" onClose={onCancel} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          여러 팀을 선택할 수 있습니다. 선택한 팀들의 구성원들이 내 글을 볼 수
          있습니다.
        </p>

        <div className="space-y-2">
          {teams.map((team) => {
            const active = draftTeamIds.includes(team.id);
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => toggleTeam(team.id)}
                className="interactive-press flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium"
                style={{
                  borderColor: active
                    ? "var(--primary)"
                    : "var(--input-border)",
                  backgroundColor: active
                    ? "var(--primary-light)"
                    : "var(--bg-muted)",
                  color: active ? "var(--primary)" : "var(--text-secondary)",
                }}
              >
                <span>{team.name}</span>
                {active && <span>선택됨</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="interactive-press flex-1 rounded-lg border py-2.5 text-sm"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draftTeamIds)}
            disabled={draftTeamIds.length === 0}
            className="interactive-press flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
