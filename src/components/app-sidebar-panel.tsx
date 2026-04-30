"use client";

import AvatarImage from "@/components/avatar-image";
import { SidebarBoardLink, SidebarData } from "@/lib/sidebar-client";
import { useTheme } from "@/lib/theme";
import Link from "next/link";

interface Props {
  data: SidebarData;
  loaded: boolean;
  onClose: () => void;
}

export default function AppSidebarPanel({ data, loaded, onClose }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 900 }}
      role="dialog"
      aria-modal="true"
      aria-label="사이드바"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <aside
        className="absolute right-0 top-0 flex h-full w-1/2 flex-col overflow-y-auto border-l lg:w-80"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-light)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex flex-col items-center gap-3 border-b p-6"
          style={{ borderColor: "var(--border-light)" }}
        >
          <AvatarImage
            src={data.avatar}
            name={data.name}
            sizeClass="h-[128px] w-[128px]"
            textClass="text-4xl"
          />
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {data.name || " "}
          </p>
        </div>

        <nav className="flex-1 px-3 py-3">
          {loaded && data.boards.length === 0 && (
            <p className="px-2 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
              게시판이 준비 중이에요
            </p>
          )}
          <div className="space-y-2">
            {data.boards.map((board) => (
              <SidebarBoardButton
                key={board.slug}
                board={board}
                onClick={onClose}
              />
            ))}
            <SidebarThemeButton
              label={theme === "light" ? "다크 모드" : "라이트 모드"}
              onClick={toggle}
            />
          </div>
        </nav>
      </aside>
    </div>
  );
}

function SidebarThemeButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="interactive-press group flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-primary)",
        boxShadow: "0 1px 0 rgb(15 23 42 / 0.03)",
      }}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{label}</span>
      </span>

      <span
        className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
        style={{ color: "var(--text-muted)" }}
        aria-hidden="true"
      >
        <ChevronIcon />
      </span>
    </button>
  );
}

function SidebarBoardButton({
  board,
  onClick,
}: {
  board: SidebarBoardLink;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/boards/${board.slug}`}
      onClick={onClick}
      className="interactive-press group flex items-center gap-3 rounded-xl border px-4 py-2.5"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-primary)",
        boxShadow: "0 1px 0 rgb(15 23 42 / 0.03)",
      }}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {board.name}
        </span>
      </span>

      <span
        className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronIcon />
      </span>
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}
