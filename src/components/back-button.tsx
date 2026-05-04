import Link from "next/link";

interface BackButtonProps {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = "뒤로" }: BackButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="interactive-press flex h-9 w-9 shrink-0 items-center justify-center"
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
    </Link>
  );
}
