"use client";

import Link from "next/link";
import AvatarImage from "@/components/avatar-image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  broadcastOverlayOpen,
  onOtherOverlayOpen,
} from "@/lib/overlay-bus";

interface BoardLink {
  slug: string;
  name: string;
}

interface SidebarData {
  avatar: string | null;
  name: string;
  boards: BoardLink[];
}

const emptySidebarData: SidebarData = {
  avatar: null,
  name: "",
  boards: [],
};

let sidebarDataCache: SidebarData | null = null;
let sidebarDataPromise: Promise<SidebarData> | null = null;

function loadSidebarData() {
  if (sidebarDataCache) return Promise.resolve(sidebarDataCache);
  if (sidebarDataPromise) return sidebarDataPromise;

  sidebarDataPromise = (async () => {
    const supabase = createClient();
    const [userResult, boardResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("boards")
        .select("slug, name, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    const user = userResult.data.user;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    let avatar =
      (meta.avatar_url as string | undefined) ??
      (meta.picture as string | undefined) ??
      null;

    let name =
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      "";

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      name = profile?.display_name || name;
      avatar = profile?.avatar_url || avatar;
    }

    const boards =
      boardResult.data?.map((board) => ({
        slug: board.slug,
        name: board.name,
      })) ?? [];

    sidebarDataCache = { avatar, name, boards };
    return sidebarDataCache;
  })().finally(() => {
    sidebarDataPromise = null;
  });

  return sidebarDataPromise;
}

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SidebarData>(
    sidebarDataCache ?? emptySidebarData
  );
  const [loaded, setLoaded] = useState(Boolean(sidebarDataCache));

  useEffect(() => {
    let cancelled = false;

    function sync() {
      loadSidebarData().then((sidebarData) => {
        if (cancelled) return;
        setData(sidebarData);
        setLoaded(true);
      });
    }

    sync();
    function handleProfileUpdated() {
      sidebarDataCache = null;
      sync();
    }

    window.addEventListener("seonlab:profile-updated", handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("seonlab:profile-updated", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // 다른 오버레이(알림)가 열리면 자신을 닫는다.
  useEffect(() => {
    return onOtherOverlayOpen("sidebar", () => setOpen(false));
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => {
          broadcastOverlayOpen("sidebar");
          setOpen(true);
        }}
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

      {open && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 900 }}
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
            {/* 프로필 영역: 상하좌우 여백 동일(p-6), 아바타 64px → 200% 확대(h-48 w-48 = 192px) */}
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

            <nav className="flex-1 py-2">
              {loaded && data.boards.length === 0 && (
                <p
                  className="px-4 py-3 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  게시판이 준비 중이에요
                </p>
              )}
              {/* 링크 클릭 시 사이드바를 먼저 닫지 않는다.
                  RouteTransitionProvider 가 클릭과 동시에 오버레이+스피너를 사이드바 위까지 덮고,
                  네비게이션 완료 후 새 페이지가 mount 되면 사이드바 컴포넌트가 자연히 unmount 된다. */}
              {data.boards.map((b) => (
                <Link
                  key={b.slug}
                  href={`/boards/${b.slug}`}
                  className="interactive-press block px-4 py-3 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {b.name}
                </Link>
              ))}
            </nav>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
