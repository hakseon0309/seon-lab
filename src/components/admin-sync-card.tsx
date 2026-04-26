"use client";

interface Props {
  syncing: boolean;
  message: string;
  onSync: () => void;
}

export default function AdminSyncCard({ syncing, message, onSync }: Props) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            모든 사용자 시프트 동기화
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            관리자 권한으로 전체 사용자 ICS 데이터를 즉시 새로고침합니다.
          </p>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          {syncing ? "동기화 중..." : "전체 새로고침"}
        </button>
      </div>
      {message && (
        <p
          className="mt-3 text-xs"
          style={{
            color: message.includes("실패") ? "var(--error)" : "var(--text-muted)",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
