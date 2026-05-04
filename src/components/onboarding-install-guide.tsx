"use client";

import { useRouteTransition } from "@/components/route-transition-provider";
import { useRouter } from "next/navigation";

export default function OnboardingInstallGuide() {
  const router = useRouter();
  const { startNavigation } = useRouteTransition();

  function continueToDashboard() {
    startNavigation();
    router.replace("/dashboard");
  }

  return (
    <section
      className="rounded-lg border p-5"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div className="space-y-5">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            앱처럼 사용하기
          </h1>
          <p
            className="mt-2 text-sm leading-6"
            style={{ color: "var(--text-secondary)" }}
          >
            홈 화면에 추가하면 근무 교환 게시판 알림을 받을 수 있어요.
          </p>
        </div>

        <ol className="space-y-3">
          {[
            "Safari에서 하단 오른쪽의 공유 버튼을 눌러주세요.",
            "홈 화면에 추가를 누른 뒤, 앱처럼 실행하기를 눌러 추가해주세요.",
            "홈 화면에서 SEON LAB을 열고 설정에서 알림 켜기 버튼을 누르면 근무 교환 게시판 알림을 받을 수 있습니다.",
          ].map((text, index) => (
            <li key={text} className="flex gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: "var(--primary-light)",
                  color: "var(--text-primary)",
                }}
              >
                {index + 1}
              </span>
              <span
                className="text-sm leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                {text}
              </span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={continueToDashboard}
          className="interactive-press w-full rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          확인
        </button>
      </div>
    </section>
  );
}
