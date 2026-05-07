"use client";

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
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const AppSidebarPanel = dynamic(() => import("@/components/app-sidebar-panel"));

let savedScrollY = 0;
let savedHtmlOverflow = "";
let savedBodyOverflow = "";
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyLeft = "";
let savedBodyRight = "";
let savedBodyWidth = "";

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SidebarData>(
    getCachedSidebarData() ?? getEmptySidebarData()
  );
  const [loaded, setLoaded] = useState(hasCachedSidebarData());

  function syncSidebarData() {
    return loadSidebarData().then((sidebarData) => {
      setData(sidebarData);
      setLoaded(true);
    });
  }

  useEffect(() => {
    let cancelled = false;
    let idleCallbackId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function sync() {
      loadSidebarData()
        .then((sidebarData) => {
          if (cancelled) return;
          setData(sidebarData);
          setLoaded(true);
        })
        .catch(() => undefined);
    }

    if (!hasCachedSidebarData()) {
      if ("requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(() => {
          if (!cancelled) sync();
        }, { timeout: 1800 });
      } else {
        timeoutId = setTimeout(() => {
          if (!cancelled) sync();
        }, 350);
      }
    }

    function handleProfileUpdated() {
      clearSidebarDataCache();
      sync();
    }

    window.addEventListener("seonlab:profile-updated", handleProfileUpdated);

    return () => {
      cancelled = true;
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener(
        "seonlab:profile-updated",
        handleProfileUpdated
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    savedScrollY = window.scrollY;
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyOverflow = document.body.style.overflow;
    savedBodyPosition = document.body.style.position;
    savedBodyTop = document.body.style.top;
    savedBodyLeft = document.body.style.left;
    savedBodyRight = document.body.style.right;
    savedBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.documentElement.style.overflow = savedHtmlOverflow;
      document.body.style.overflow = savedBodyOverflow;
      document.body.style.position = savedBodyPosition;
      document.body.style.top = savedBodyTop;
      document.body.style.left = savedBodyLeft;
      document.body.style.right = savedBodyRight;
      document.body.style.width = savedBodyWidth;
      window.scrollTo(0, savedScrollY);
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
          void import("@/components/app-sidebar-panel");
          if (!loaded) {
            void syncSidebarData().catch(() => undefined);
          }
        }}
        onFocus={() => {
          void import("@/components/app-sidebar-panel");
        }}
        onPointerEnter={() => {
          void import("@/components/app-sidebar-panel");
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
