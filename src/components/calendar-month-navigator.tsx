"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  currentDate: Date;
  pending?: boolean;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function CalendarMonthNavigator({
  currentDate,
  pending = false,
  previousDisabled = false,
  nextDisabled = false,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div
      className="sticky top-28 z-20 flex items-center justify-between px-4 py-3 lg:top-0 lg:px-0"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={pending || previousDisabled}
        aria-label="이전 달"
        className="interactive-press flex h-9 w-9 items-center justify-center disabled:opacity-60"
        style={{ color: "var(--button-surface)" }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <h2
        className="text-xl font-semibold sm:text-2xl"
        style={{ color: "var(--text-primary)" }}
      >
        {format(currentDate, "yyyy년 M월", { locale: ko })}
      </h2>

      <button
        type="button"
        onClick={onNext}
        disabled={pending || nextDisabled}
        aria-label="다음 달"
        className="interactive-press flex h-9 w-9 items-center justify-center disabled:opacity-60"
        style={{ color: "var(--button-surface)" }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
