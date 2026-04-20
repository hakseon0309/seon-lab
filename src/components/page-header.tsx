import { ReactNode } from "react";

interface PageHeaderProps {
  children: ReactNode;
  maxWidth?: string;
}

export default function PageHeader({ children, maxWidth = "max-w-5xl" }: PageHeaderProps) {
  return (
    <>
      {/* 모바일: 상단 nav 바로 아래 고정 */}
      <div
        className="lg:hidden fixed top-14 left-0 right-0 z-30 flex h-14 items-center justify-between px-4"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        {children}
      </div>
      <div className="h-14 lg:hidden" />

      {/* 데스크탑: 일반 흐름 */}
      <div
        className="hidden lg:flex h-14 items-center"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div className={`mx-auto flex w-full ${maxWidth} items-center justify-between px-4`}>
          {children}
        </div>
      </div>
    </>
  );
}
