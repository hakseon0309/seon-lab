"use client";

import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();

  const links = [
    { href: "/dashboard", label: "달력", icon: "📅" },
    { href: "/teams", label: "팀", icon: "👥" },
    { href: "/settings", label: "설정", icon: "⚙️" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── 데스크탑: 상단 nav ── */}
      <nav
        className="hidden lg:block border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold" style={{ color: "var(--primary)" }}>
              Seon Lab
            </Link>
            <div className="flex gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium"
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
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ color: "var(--text-muted)" }}
              title={theme === "light" ? "다크 모드" : "라이트 모드"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button onClick={handleLogout} className="text-sm" style={{ color: "var(--text-muted)" }}>
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* ── 모바일: 상단 타이틀바 ── */}
      <header
        className="lg:hidden flex items-center justify-between px-4 h-12 border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        <span className="text-base font-bold" style={{ color: "var(--primary)" }}>
          Seon Lab
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-1.5 text-base"
            style={{ color: "var(--text-muted)" }}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-2 py-1 rounded-md border"
            style={{ color: "var(--text-muted)", borderColor: "var(--border-light)" }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* ── 모바일: 하단 탭바 ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5"
              style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
            >
              <span className="text-xl leading-none">{link.icon}</span>
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

    </>
  );
}
