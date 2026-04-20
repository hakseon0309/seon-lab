import { ReactNode } from "react";

interface PageFooterProps {
  children: ReactNode;
  maxWidth?: string;
}

export default function PageFooter({ children, maxWidth = "max-w-lg" }: PageFooterProps) {
  return (
    <>
      {/* 모바일: 하단 탭바 위 고정, 투명 배경, 탭바와 동일한 여백 */}
      <div
        className="lg:hidden fixed left-0 right-0 z-30 flex items-center gap-4 px-4"
        style={{ bottom: "calc(3.5rem + 1rem)" }}
      >
        {children}
      </div>

      {/* 데스크탑: 하단 고정, 투명 배경 */}
      <div
        className="hidden lg:flex fixed left-0 right-0 z-30 items-center justify-center"
        style={{ bottom: "1rem" }}
      >
        <div className={`flex w-full ${maxWidth} items-center gap-4 px-4`}>
          {children}
        </div>
      </div>
    </>
  );
}
