"use client";

import AppSidebarPanel from "@/components/app-sidebar-panel";
import {
  clearSidebarDataCache,
  getCachedSidebarData,
  getEmptySidebarData,
  hasCachedSidebarData,
  loadSidebarData,
  SidebarData,
} from "@/lib/sidebar-client";
import {
  broadcastOverlayOpen,
  onOtherOverlayOpen,
} from "@/lib/overlay-bus";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SidebarData>(
    getCachedSidebarData() ?? getEmptySidebarData()
  );
  const [loaded, setLoaded] = useState(hasCachedSidebarData());

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
      clearSidebarDataCache();
      sync();
    }

    window.addEventListener("seonlab:profile-updated", handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(
        "seonlab:profile-updated",
        handleProfileUpdated
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

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
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="block h-[2px] w-5 rounded-full"
              style={{ backgroundColor: "currentColor" }}
            />
          ))}
        </span>
      </button>

      {open &&
        createPortal(
          <AppSidebarPanel
            data={data}
            loaded={loaded}
            onClose={() => setOpen(false)}
          />,
          document.body
        )}
    </>
  );
}
