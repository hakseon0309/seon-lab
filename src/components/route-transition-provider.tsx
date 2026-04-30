"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ROUTE_OVERLAY_TIMEOUT_MS = 10000;
// 네비게이션 클릭 즉시 어둡게 + 스피너가 보이도록 delay 0. 서버 응답이 매우 빠른
// 경우에도 플래시가 생기더라도 "즉시 반응" 이 더 중요하다.
const ROUTE_OVERLAY_DELAY_MS = 0;

type RouteTransitionContextValue = {
  startNavigation: () => void;
  stopNavigation: () => void;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const delayRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    if (delayRef.current) {
      window.clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    if (delayRef.current) {
      window.clearTimeout(delayRef.current);
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    delayRef.current = window.setTimeout(() => {
      setIsNavigating(true);
      delayRef.current = null;
    }, ROUTE_OVERLAY_DELAY_MS);

    timeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      if (delayRef.current) {
        window.clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      timeoutRef.current = null;
    }, ROUTE_OVERLAY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSamePage =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash;

      if (nextUrl.origin !== currentUrl.origin || isSamePage) return;

      startNavigation();
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [startNavigation]);

  useEffect(() => {
    return () => {
      if (delayRef.current) {
        window.clearTimeout(delayRef.current);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      startNavigation,
      stopNavigation,
    }),
    [startNavigation, stopNavigation]
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      {isNavigating && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 backdrop-blur-[1px]"
          style={{ zIndex: 1500 }}
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="flex items-center justify-center rounded-[1.75rem] border shadow-2xl"
            style={{
              width: "clamp(7.5rem, 28vw, 12rem)",
              height: "clamp(7.5rem, 28vw, 12rem)",
              borderColor: "var(--border-light)",
              backgroundColor: "var(--bg-card)",
            }}
          >
            <div
              className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        </div>
      )}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error("useRouteTransition must be used within RouteTransitionProvider");
  }
  return context;
}
