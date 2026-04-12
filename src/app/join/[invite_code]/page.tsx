"use client";

import { createClient } from "@/lib/supabase/client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage({
  params,
}: {
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = use(params);
  const [status, setStatus] = useState<
    "loading" | "joining" | "error" | "done"
  >("loading");
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function join() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?next=/join/${invite_code}`);
        return;
      }

      setStatus("joining");

      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "팀 가입에 실패했습니다");
        return;
      }

      setStatus("done");
      if (data.already_member) {
        setMessage("이미 참여 중인 팀입니다");
      }

      setTimeout(() => {
        router.push(`/teams/${data.team_id}`);
      }, 1500);
    }

    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite_code]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            인증 확인 중...
          </p>
        )}
        {status === "joining" && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            팀에 참여하는 중...
          </p>
        )}
        {status === "done" && (
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--success)" }}
            >
              {message || "팀에 참여했습니다!"}
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              잠시 후 이동합니다...
            </p>
          </div>
        )}
        {status === "error" && (
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--error)" }}
            >
              {message}
            </p>
            <button
              onClick={() => router.push("/teams")}
              className="mt-4 text-sm hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              팀 목록으로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
