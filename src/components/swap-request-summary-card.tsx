"use client";

import { SwapSummaryCardData, SwapSummaryRow } from "@/lib/swap-board";
import { type ReactNode } from "react";

interface Props {
  summary: SwapSummaryCardData;
}

export default function SwapRequestSummaryCard({ summary }: Props) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: "var(--primary-light)",
            color: "var(--text-primary)",
          }}
        >
          <SwapArrowsIcon />
          {summary.typeLabel}
        </span>
      </div>

      <div className="space-y-2.5">
        <SummaryRow row={summary.mine} />
        <SummaryRow row={summary.target} />
      </div>
    </div>
  );
}

function SummaryRow({ row }: { row: SwapSummaryRow }) {
  const accent = row.tone === "target";

  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)] items-start gap-2">
      <span
        className="inline-flex min-h-10 items-center justify-center rounded-xl border px-2 py-2 text-center text-[11px] font-semibold"
        style={{
          borderColor: accent ? "transparent" : "var(--border-light)",
          backgroundColor: accent
            ? "var(--secondary-light)"
            : "var(--bg-surface)",
          color: accent ? "var(--secondary)" : "var(--text-secondary)",
        }}
      >
        {row.label}
      </span>

      <div
        className="rounded-xl border p-2.5"
        style={{
          borderColor: "var(--border-light)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div className="flex flex-wrap gap-2">
          <InfoToken icon={<CalendarIcon />}>{row.date}</InfoToken>
          {row.values.map((value, index) => (
            <InfoToken
              key={`${row.label}-${value}-${index}`}
              icon={index === 0 ? <ClockIcon /> : <SparkIcon />}
              accent={accent}
            >
              {value}
            </InfoToken>
          ))}
        </div>

        {row.secondary && (
          <p
            className="mt-2 text-[11px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {row.secondary}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoToken({
  children,
  icon,
  accent = false,
}: {
  children: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold"
      style={{
        borderColor: accent ? "transparent" : "var(--border-light)",
        backgroundColor: accent ? "var(--secondary-light)" : "var(--bg-card)",
        color: accent ? "var(--secondary)" : "var(--text-primary)",
      }}
    >
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

function SwapArrowsIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M6 5h8l-2.5-2.5" />
      <path d="M14 15H6l2.5 2.5" />
      <path d="M14 5l2 2-2 2" />
      <path d="M6 15l-2-2 2-2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <rect x="3.5" y="4.5" width="13" height="12" rx="2.5" />
      <path d="M6.5 3.5v3" />
      <path d="M13.5 3.5v3" />
      <path d="M3.5 8.5h13" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.5v4l2.5 1.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M10 3.5l1.4 3.6L15 8.5l-3.6 1.4L10 13.5l-1.4-3.6L5 8.5l3.6-1.4L10 3.5z" />
    </svg>
  );
}
