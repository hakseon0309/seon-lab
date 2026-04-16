"use client";

import Nav from "@/components/nav";
import CoupleSettingsPanel from "@/components/couple-settings-panel";
import Link from "next/link";

export default function BetaSettingsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-lg py-6 pb-24 lg:py-8 lg:pb-8">
        <div className="px-4 lg:px-0">
          <div className="page-title-block">
            <Link
              href="/settings"
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              ← 설정으로 돌아가기
            </Link>
            <h1 className="mt-3 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              베타 기능 사용해보기
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              아직 다듬는 중인 기능들을 먼저 써볼 수 있는 공간입니다.
            </p>
          </div>

          <CoupleSettingsPanel />
        </div>
      </main>
    </>
  );
}
