import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-8 px-6 text-center">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--primary)" }}
          >
            Seon Lab
          </h1>
          <p
            className="mt-3 text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            팀원들의 근무 시프트를 한눈에 확인하세요
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Apple 캘린더 구독 URL 기반 시프트 공유 서비스
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-lg border text-sm font-medium"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
