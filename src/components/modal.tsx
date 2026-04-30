"use client";

import { CSSProperties, ReactNode, useEffect } from "react";
import { useClientReady } from "@/lib/client-dom";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  header?: ReactNode;
  panelClassName?: string;
  panelStyle?: CSSProperties;
}

let openModalCount = 0;
let savedScrollY = 0;
let savedHtmlOverflow = "";
let savedBodyOverflow = "";
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyLeft = "";
let savedBodyRight = "";
let savedBodyWidth = "";

/**
 * 공용 Modal.
 *
 * 핵심 계약:
 *  - 반드시 document.body 로 portal 한다. PageHeader / Nav 등 이미 position:fixed
 *    인 조상 안에서 렌더되면 부모 stacking context 에 갇혀 Nav / 탭바 위로 올라오지
 *    못한다.
 *  - z-index 는 인라인 스타일로 고정값(1000)을 쓴다. Tailwind 의 임의값
 *    `z-[N]` 이 빌드 환경에 따라 누락될 때가 있어, 앱 내 가장 높은 레이어가
 *    확실히 되도록 명시적으로 지정한다.
 *  - 백드롭과 카드는 별도 DOM 요소로 분리 (AppSidebar 와 동일 패턴).
 *    백드롭 클릭은 onClose, 카드 클릭은 stopPropagation.
 */
export default function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-sm",
  header,
  panelClassName = "mx-4 p-6",
  panelStyle,
}: ModalProps) {
  const mounted = useClientReady();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (openModalCount === 0) {
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
    }

    openModalCount += 1;

    return () => {
      openModalCount = Math.max(0, openModalCount - 1);

      if (openModalCount === 0) {
        document.documentElement.style.overflow = savedHtmlOverflow;
        document.body.style.overflow = savedBodyOverflow;
        document.body.style.position = savedBodyPosition;
        document.body.style.top = savedBodyTop;
        document.body.style.left = savedBodyLeft;
        document.body.style.right = savedBodyRight;
        document.body.style.width = savedBodyWidth;
        window.scrollTo(0, savedScrollY);
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 1000, overscrollBehavior: "contain" }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      {/* 백드롭은 어떤 padding 에도 영향받지 않도록 부모와 나란히 inset-0 으로
          전체를 덮는다. 부모에 padding 을 주면 absolute inset-0 이 padding-box
          안쪽만 채워 모서리에 dim 누락 띠가 생기므로 절대 padding 을 부모에 두지 말 것. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgb(0 0 0 / 0.6)" }}
      />
      <div
        className={`relative w-full ${maxWidth} rounded-2xl ${panelClassName}`}
        style={{ backgroundColor: "var(--bg-card)", ...panelStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          {header ?? (
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h3>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
