"use client";

interface Props {
  value: string;
  sending: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function ChatComposer({
  value,
  sending,
  disabled,
  onChange,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="mx-4 mt-4 flex gap-2 lg:mx-0"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "완료된 글입니다" : "메시지 입력…"}
        maxLength={4000}
        className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
        style={
          {
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
            "--tw-ring-color": "var(--primary)",
          } as React.CSSProperties
        }
      />
      <button
        type="submit"
        disabled={sending || value.trim().length === 0 || disabled}
        className="interactive-press shrink-0 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--text-on-primary)",
        }}
      >
        전송
      </button>
    </form>
  );
}
