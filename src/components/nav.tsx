"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/app-sidebar";
import NotificationBell from "@/components/notification-bell";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "달력" },
    { href: "/teams", label: "팀" },
    { href: "/settings", label: "설정" },
  ];

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-40 border-b lg:static"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="interactive-press text-[21px] font-bold tracking-[0.02em] lg:text-[17px]"
              style={{ color: "var(--text-primary)" }}
            >
              SEON LAB
            </Link>
            <div className="hidden gap-1 lg:flex">
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
          <div className="flex items-center gap-1">
            <NotificationBell />
            <AppSidebar />
          </div>
        </div>
      </nav>
      <div className="h-14 lg:hidden" />

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-light)",
          height: "calc(3.5rem + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex h-14 w-full">
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
        </div>
      </nav>
    </>
  );
}
