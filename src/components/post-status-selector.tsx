"use client";

const STATUS_OPTIONS: {
  value: "requested" | "accepted" | "resolved";
  label: string;
}[] = [
  { value: "requested", label: "요청됨" },
  { value: "accepted", label: "접수됨" },
  { value: "resolved", label: "해결됨" },
];

interface Props {
  currentStatus: "requested" | "accepted" | "resolved" | null;
  disabled: boolean;
  onChange: (status: "requested" | "accepted" | "resolved") => void;
}

export default function PostStatusSelector({
  currentStatus,
  disabled,
  onChange,
}: Props) {
  return (
    <div className="mb-4">
      <p
        className="mb-2 text-xs font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        상태
      </p>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((option) => {
          const active = currentStatus === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className="interactive-press flex-1 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              style={{
                backgroundColor: active
                  ? "var(--primary-light)"
                  : "var(--bg-surface)",
                color: active ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
