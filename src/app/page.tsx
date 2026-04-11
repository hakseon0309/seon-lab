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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-8 px-6 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Seon Lab
          </h1>
          <p className="mt-3 text-base text-gray-500">
            팀원들의 근무 시프트를 한눈에 확인하세요
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Apple 캘린더 구독 URL 기반 시프트 공유 서비스
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-800"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
