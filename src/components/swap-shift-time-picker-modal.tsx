"use client";

import Modal from "@/components/modal";
import { WORK_SHIFT_OPTIONS } from "@/lib/swap-board";
import { useState } from "react";

interface Props {
  selectedTimes: string[];
  onCancel: () => void;
  onConfirm: (times: string[]) => void;
}

export default function SwapShiftTimePickerModal({
  selectedTimes,
  onCancel,
  onConfirm,
}: Props) {
  const [draftSelections, setDraftSelections] = useState<string[]>(
    selectedTimes
  );

  function toggleTime(time: string) {
    setDraftSelections((prev) =>
      prev.includes(time)
        ? prev.filter((selected) => selected !== time)
        : [...prev, time]
    );
  }

  return (
    <Modal title="원하는 시프트 선택" onClose={onCancel} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          원하는 시프트를 선택하세요. 여러 개 선택할 수 있어요.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WORK_SHIFT_OPTIONS.map((time) => {
            const active = draftSelections.includes(time);
            return (
              <button
                key={time}
                type="button"
                onClick={() => toggleTime(time)}
                className="interactive-press rounded-lg border px-3 py-3 text-sm font-medium"
                style={{
                  borderColor: active
                    ? "var(--primary)"
                    : "var(--input-border)",
                  backgroundColor: active
                    ? "var(--primary-light)"
                    : "var(--bg-muted)",
                  color: active ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                {time}
              </button>
            );
          })}
        </div>

        <div
          className="min-h-20 rounded-lg border px-3 py-3"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          {draftSelections.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              아직 선택된 시간대가 없습니다.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {WORK_SHIFT_OPTIONS.filter((time) =>
                draftSelections.includes(time)
              ).map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className="interactive-press rounded-full border px-3 py-1 text-xs"
                  style={{
                    borderColor: "var(--primary)",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--primary)",
                  }}
                >
                  {time} ✕
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraftSelections([])}
            className="interactive-press flex-1 rounded-lg border py-2.5 text-sm"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draftSelections)}
            className="interactive-press flex-1 rounded-lg py-2.5 text-sm font-medium"
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
