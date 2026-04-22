"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BoardLink {
  slug: string;
  name: string;
}

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [boards, setBoards] = useState<BoardLink[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const meta = userData.user.user_metadata as Record<string, unknown>;
        const av =
          (meta.avatar_url as string | undefined) ??
          (meta.picture as string | undefined) ??
          null;
        setAvatar(av);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("id", userData.user.id)
          .maybeSingle();
        setName(
          profile?.display_name ||
            (meta.full_name as string | undefined) ||
            (meta.name as string | undefined) ||
            ""
        );
      }

      const { data: boardData } = await supabase
        .from("boards")
        .select("slug, name, sort_order")
        .order("sort_order", { ascending: true });
      if (boardData) {
        setBoards(boardData.map((b) => ({ slug: b.slug, name: b.name })));
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="interactive-press flex h-9 w-9 items-center justify-center rounded-md"
        style={{ color: "var(--text-primary)" }}
      >
        <span className="flex flex-col gap-[5px]">
          <span
            className="block h-[2px] w-5 rounded-full"
            style={{ backgroundColor: "currentColor" }}
          />
          <span
            className="block h-[2px] w-5 rounded-full"
            style={{ backgroundColor: "currentColor" }}
          />
          <span
            className="block h-[2px] w-5 rounded-full"
            style={{ backgroundColor: "currentColor" }}
          />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100]"
          role="dialog"
          aria-modal="true"
          aria-label="사이드바"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute right-0 top-0 flex h-full w-1/2 flex-col overflow-y-auto border-l lg:w-80"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-light)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-4 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                닫기
              </button>
            </div>

            <div
              className="flex flex-col items-center gap-2 border-b px-4 pb-5 pt-2"
              style={{ borderColor: "var(--border-light)" }}
            >
              <div
                className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-muted)",
                }}
              >
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-lg font-semibold">
                    {name ? name.slice(0, 1) : "?"}
                  </span>
                )}
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {name || " "}
              </p>
            </div>

            <nav className="flex-1 py-2">
              {loaded && boards.length === 0 && (
                <p
                  className="px-4 py-3 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  게시판이 준비 중이에요
                </p>
              )}
              {boards.map((b) => (
                <Link
                  key={b.slug}
                  href={`/boards/${b.slug}`}
                  onClick={() => setOpen(false)}
                  className="interactive-press block px-4 py-3 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {b.name}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
