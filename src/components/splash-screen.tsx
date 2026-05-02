"use client";

import { useEffect } from "react";

/**
 * 초기 HTML에 포함되어 첫 페인트부터 즉시 보이며,
 * 클라이언트 hydration이 끝나면 body에 `app-ready` 클래스를 붙여 사라지게 한다.
 * CSS transition으로 opacity가 0이 된 뒤 visibility:hidden 처리되므로
 * 이후에는 포인터 이벤트를 가로채지 않는다.
 */
function SplashReadyMarker() {
  useEffect(() => {
    document.body.classList.add("app-ready");
  }, []);
  return null;
}

export default function SplashScreen() {
  return (
    <>
      <div className="splash-screen" aria-hidden="true">
        <div className="splash-screen__mark">SEON LAB</div>
      </div>
      <SplashReadyMarker />
    </>
  );
}
