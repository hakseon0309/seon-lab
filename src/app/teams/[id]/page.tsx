"use client";

import { createClient } from "@/lib/supabase/client";
import { Team, CalendarEvent, UserProfile } from "@/lib/types";
import Nav from "@/components/nav";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import QRCode from "qrcode";

interface MemberWithEvents {
  profile: UserProfile;
  events: CalendarEvent[];
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<MemberWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();

      if (!teamData) {
        router.push("/teams");
        return;
      }
      setTeam(teamData);

      // Generate QR with 6-char code only (not URL)
      const qr = await QRCode.toDataURL(teamData.invite_code, {
        width: 200,
        margin: 2,
      });
      setQrUrl(qr);

      // Load members
      const { data: memberData } = await supabase
        .from("team_members")
        .select("*, user_profiles(*)")
        .eq("team_id", id);

      if (memberData) {
        const memberEvents: MemberWithEvents[] = [];
        for (const member of memberData) {
          const { data: events } = await supabase
            .from("events")
            .select("*")
            .eq("user_id", member.user_id)
            .order("start_at", { ascending: true });

          memberEvents.push({
            profile: member.user_profiles as UserProfile,
            events: events || [],
          });
        }
        setMembers(memberEvents);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!team) return null;

  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), {
    weekStartsOn: 1,
  });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-xs text-gray-400">
              {members.length}명의 멤버
            </p>
          </div>
        </div>

        {/* Invite Section */}
        <details className="mb-6 rounded-lg border border-gray-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            팀 초대하기
          </summary>
          <div className="mt-4 flex flex-col items-center gap-6">
            {/* 초대 코드 */}
            <div className="text-center">
              <p className="mb-2 text-xs text-gray-500">초대 코드</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-bold tracking-[0.3em] text-gray-900">
                  {team.invite_code}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(team.invite_code)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  복사
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                팀원에게 이 코드를 알려주세요
              </p>
            </div>

            {/* QR 코드 */}
            {qrUrl && (
              <div className="text-center">
                <p className="mb-2 text-xs text-gray-500">또는 QR 코드를 보여주세요</p>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="mx-auto h-[180px] w-[180px] rounded-lg"
                />
              </div>
            )}
          </div>
        </details>

        {/* Week Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            &larr; 이전 주
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekDays[0], "M/d", { locale: ko })} -{" "}
            {format(weekDays[6], "M/d", { locale: ko })}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            다음 주 &rarr;
          </button>
        </div>

        {/* Shift Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">
                  멤버
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={`border-b border-gray-200 px-3 py-3 text-center text-xs font-medium ${
                      isSameDay(day, today)
                        ? "bg-gray-900 text-white"
                        : "text-gray-500"
                    }`}
                  >
                    <div>{format(day, "EEE", { locale: ko })}</div>
                    <div>{format(day, "M/d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(({ profile, events }) => (
                <tr key={profile.id} className="border-b border-gray-100">
                  <td className="sticky left-0 z-10 border-r border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900">
                    {profile.display_name}
                  </td>
                  {weekDays.map((day) => {
                    const dayEvents = events.filter((e) =>
                      isSameDay(new Date(e.start_at), day)
                    );
                    return (
                      <td
                        key={day.toISOString()}
                        className="px-2 py-2 text-center"
                      >
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="mb-1 rounded bg-blue-50 px-1.5 py-1 text-[11px] leading-tight text-blue-700"
                            title={event.summary}
                          >
                            <div className="font-medium">{event.summary}</div>
                            <div className="text-blue-500">
                              {format(new Date(event.start_at), "HH:mm")}-
                              {format(new Date(event.end_at), "HH:mm")}
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
