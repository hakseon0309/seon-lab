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
      className="interactive-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-medium"
      style={{
        color: "var(--text-primary)",
        backgroundColor: "var(--button-surface)",
      }}
    >
      ‹
    </Link>
  );
}
