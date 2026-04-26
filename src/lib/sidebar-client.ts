"use client";

import { createClient } from "@/lib/supabase/client";

export interface SidebarBoardLink {
  slug: string;
  name: string;
}

export interface SidebarData {
  avatar: string | null;
  name: string;
  boards: SidebarBoardLink[];
}

const emptySidebarData: SidebarData = {
  avatar: null,
  name: "",
  boards: [],
};

let sidebarDataCache: SidebarData | null = null;
let sidebarDataPromise: Promise<SidebarData> | null = null;

export function getEmptySidebarData() {
  return emptySidebarData;
}

export function getCachedSidebarData() {
  return sidebarDataCache;
}

export function clearSidebarDataCache() {
  sidebarDataCache = null;
}

export function hasCachedSidebarData() {
  return Boolean(sidebarDataCache);
}

export function loadSidebarData() {
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
