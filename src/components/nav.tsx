"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "달력" },
    { href: "/teams", label: "팀" },
    { href: "/settings", label: "설정" },
  ];

  return (
    <>
      {/* ── 데스크탑: 상단 nav ── */}
      <nav
        className="hidden lg:block border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="interactive-press rounded-md px-1 py-1 text-xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              SEON LAB
            </Link>
            <div className="flex gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="interactive-press rounded-md px-3 py-1.5 text-sm font-medium"
                  style={{
                    backgroundColor: pathname.startsWith(link.href) ? "var(--primary-light)" : "transparent",
                    color: pathname.startsWith(link.href) ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── 모바일: 상단 타이틀바 ── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4 border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        <Link
          href="/dashboard"
          className="interactive-press rounded-md px-1 py-1 text-lg font-bold"
          style={{ color: "var(--primary)" }}
        >
          SEON LAB
        </Link>
      </header>
      <div className="h-14 lg:hidden" />

      {/* ── 모바일: 하단 탭바 ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="interactive-press flex flex-1 items-center justify-center text-sm font-medium"
              style={{
                color: active ? "var(--primary)" : "var(--text-muted)",
                backgroundColor: active ? "var(--primary-light)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
