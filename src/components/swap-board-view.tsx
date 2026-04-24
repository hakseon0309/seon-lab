"use client";

import Link from "next/link";
import Modal from "@/components/modal";
import AvatarImage from "@/components/avatar-image";
import PostStatusBadge from "@/components/post-status-badge";
import { useToast } from "@/components/toast-provider";
import { Board, SwapEvent, SwapPost, TeamLite } from "@/lib/types";
import {
  formatPostedAt,
  formatShiftRange,
  formatShiftStart,
  formatSwapDateShort,
  getSeoulDateKey,
} from "@/lib/time";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  board: Board;
  initialPosts: SwapPost[];
  currentUserId: string;
  myTeams: TeamLite[];
}

export default function SwapBoardView({
  board,
  initialPosts,
  currentUserId: _currentUserId,
  myTeams,
}: Props) {
  const [writing, setWriting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  return (
    <div className="px-4 lg:px-0">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setWriting(true)}
          className="interactive-press shrink-0 rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          글쓰기
        </button>
      </div>

      {initialPosts.length === 0 ? (
        <div
          className="rounded-lg border px-4 py-10 text-center"
          style={{
            borderColor: "var(--border-light)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            아직 등록된 글이 없어요
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            시프트를 바꾸고 싶은 날짜를 골라 첫 글을 남겨보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {initialPosts.map((post) => {
            const completed = post.swap_status === "done";
            return (
              <li key={post.id}>
                <Link
                  href={completed ? "#" : `/boards/${board.slug}/${post.id}`}
                  aria-disabled={completed}
                  tabIndex={completed ? -1 : 0}
                  onClick={(e) => {
                    if (completed) e.preventDefault();
                  }}
                  className="interactive-press flex flex-col gap-2 rounded-lg border px-3 py-3"
                  style={{
                    borderColor: "var(--border-light)",
                    backgroundColor: "var(--bg-card)",
                    opacity: completed ? 0.6 : 1,
                    pointerEvents: completed ? "none" : "auto",
                  }}
                >
                  {/* 윗줄 : 날짜 시프트 로 제목 */}
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatPreviewTitle(post.swap_date, post.swap_event, post.title)}
                  </p>
                  {/* 아랫줄 : [아바타] 작성자 · 팀 · 시각   [상태] */}
                  <div className="flex items-center gap-2">
                    <AvatarImage
                      src={post.author_avatar_url ?? null}
                      name={post.author_name || "이름 없음"}
                      sizeClass="h-7 w-7"
                    />
                    <p
                      className="min-w-0 flex-1 truncate text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {post.author_name} · {post.team_name} ·{" "}
                      {formatPostedAt(post.created_at)}
                    </p>
                    <PostStatusBadge
                      status={post.swap_status}
                      className="shrink-0"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {writing && (
        <WriteModal
          boardSlug={board.slug}
          myTeams={myTeams}
          onClose={() => setWriting(false)}
          onCreated={() => {
            setWriting(false);
            toast.success("글을 등록했습니다");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/**
 * 미리보기/목록 공용 타이틀 포맷.
 * 예) "26. 04. 25 (토) 09:45 – 18:45 로 조카 생일"
 *     "26. 04. 25 (토) 휴무 로 대신 서줄게요"
 */
export function formatPreviewTitle(
  swapDate: string | null,
  event: SwapEvent | null,
  title: string
): string {
  const dateLabel = formatSwapDateShort(swapDate);
  const shiftLabel = formatShiftRange(event);
  const cleanTitle = title.trim();
  const head = dateLabel ? `${dateLabel} ${shiftLabel}` : shiftLabel;
  return cleanTitle ? `${head} 로 ${cleanTitle}` : head;
}

// ============================================================
// 글쓰기 모달
// ============================================================
interface WriteModalProps {
  boardSlug: string;
  myTeams: TeamLite[];
  onClose: () => void;
  onCreated: () => void;
}

function WriteModal({ boardSlug, myTeams, onClose, onCreated }: WriteModalProps) {
  const today = getSeoulDateKey(new Date());
  const [teamId, setTeamId] = useState(myTeams[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [event, setEvent] = useState<SwapEvent | null>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // 선택한 날짜의 내 시프트 조회 (미리보기 카드용)
  useEffect(() => {
    if (!date) {
      setEvent(null);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/shifts/me?date=${date}`, {
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => ({ event: null }));
        setEvent(data.event ?? null);
      } catch {
        // aborted
      }
    })();
    return () => ctrl.abort();
  }, [date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) {
      toast.error("팀을 선택해주세요");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/boards/${boardSlug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        team_id: teamId,
        swap_date: date,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error || "등록에 실패했습니다");
      return;
    }
    onCreated();
  }

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
    "--tw-ring-color": "var(--primary)",
  } as React.CSSProperties;

  return (
    <>
      <Modal
        title="시프트 교환 글쓰기"
        onClose={onClose}
        maxWidth="max-w-lg"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              팀
            </label>
            {myTeams.length === 0 ? (
              <p
                className="rounded-lg border px-3 py-2 text-xs"
                style={{
                  borderColor: "var(--border-light)",
                  color: "var(--text-muted)",
                }}
              >
                가입된 팀이 없습니다. 팀에 가입 후 이용해주세요.
              </p>
            ) : (
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              >
                {myTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              교환할 날짜
            </label>
            <button
              type="button"
              onClick={() => setPickingDate(true)}
              className="interactive-press w-full rounded-lg border px-3 py-2 text-left text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: date ? "var(--input-text)" : "var(--input-placeholder)",
              }}
            >
              {date ? formatSwapDateShort(date) : "날짜를 선택하세요"}
            </button>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              제목
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="이곳에 찾는 시각을 입력하세요"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              내용
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="상황·조건을 자유롭게 적어주세요"
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          {date && (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              미리보기 :{" "}
              <span style={{ color: "var(--text-primary)" }}>
                {formatPreviewTitle(date, event, title || "(제목)")}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || myTeams.length === 0}
            className="interactive-press w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-on-primary)",
            }}
          >
            {submitting ? "등록 중…" : "등록"}
          </button>
        </form>
      </Modal>

      {pickingDate && (
        <DatePickerModal
          initialDate={date || today}
          minDate={today}
          onCancel={() => setPickingDate(false)}
          onPick={(d) => {
            setDate(d);
            setPickingDate(false);
          }}
        />
      )}
    </>
  );
}

// ============================================================
// 날짜 선택 모달 (미니 달력 + 각 칸에 내 시프트 시작 시각)
// ============================================================
interface DatePickerModalProps {
  initialDate: string; // YYYY-MM-DD
  minDate: string; // 오늘 (이전은 비활성화)
  onCancel: () => void;
  onPick: (date: string) => void;
}

function DatePickerModal({
  initialDate,
  minDate,
  onCancel,
  onPick,
}: DatePickerModalProps) {
  // 보고 있는 달의 기준일 (1일)
  const [cursor, setCursor] = useState(() => {
    const [y, m] = initialDate.split("-");
    return `${y}-${m}-01`;
  });
  const [eventsByDate, setEventsByDate] = useState<Map<string, SwapEvent>>(
    new Map()
  );

  // 달력 범위 계산 (월의 첫 주 일요일 ~ 마지막 주 토요일)
  const { firstCell, lastCell, monthStart, monthEnd, label } = useMemo(() => {
    const [y, m] = cursor.split("-").map(Number);
    const monthStart = new Date(Date.UTC(y, m - 1, 1));
    const monthEnd = new Date(Date.UTC(y, m, 0)); // 말일
    // 주는 월요일부터 시작 (Seon Lab 달력 일관성)
    const startDow = (monthStart.getUTCDay() + 6) % 7; // 월=0
    const endDow = (monthEnd.getUTCDay() + 6) % 7;
    const firstCell = new Date(monthStart);
    firstCell.setUTCDate(monthStart.getUTCDate() - startDow);
    const lastCell = new Date(monthEnd);
    lastCell.setUTCDate(monthEnd.getUTCDate() + (6 - endDow));
    return {
      firstCell,
      lastCell,
      monthStart,
      monthEnd,
      label: `${y}년 ${m}월`,
    };
  }, [cursor]);

  // 보이는 범위의 내 시프트 로드
  useEffect(() => {
    const from = isoDate(firstCell);
    const to = isoDate(lastCell);
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/shifts/me?from=${from}&to=${to}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const map = new Map<string, SwapEvent>();
        for (const ev of (data.events ?? []) as SwapEvent[]) {
          const key = new Date(ev.start_at).toLocaleDateString("en-CA", {
            timeZone: "Asia/Seoul",
          });
          if (!map.has(key)) map.set(key, ev);
        }
        setEventsByDate(map);
      } catch {
        // aborted
      }
    })();
    return () => ctrl.abort();
  }, [firstCell, lastCell]);

  const cells: string[] = [];
  for (
    let d = new Date(firstCell);
    d <= lastCell;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    cells.push(isoDate(d));
  }

  function prevMonth() {
    const [y, m] = cursor.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 2, 1));
    setCursor(
      `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}-01`
    );
  }
  function nextMonth() {
    const [y, m] = cursor.split("-").map(Number);
    const next = new Date(Date.UTC(y, m, 1));
    setCursor(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`
    );
  }

  const monthStartIso = isoDate(monthStart);
  const monthEndIso = isoDate(monthEnd);

  return (
    <Modal title="날짜 선택" onClose={onCancel} maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="이전 달"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--button-surface)",
            }}
          >
            ‹
          </button>
          <span
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="다음 달"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--button-surface)",
            }}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
          {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const inMonth = d >= monthStartIso && d <= monthEndIso;
            const disabled = d < minDate;
            const ev = eventsByDate.get(d);
            const dayNum = Number(d.split("-")[2]);
            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => onPick(d)}
                className="interactive-press flex aspect-square flex-col items-center justify-center rounded-md border text-xs disabled:opacity-30"
                style={{
                  borderColor: "var(--border-light)",
                  backgroundColor: inMonth
                    ? "var(--bg-card)"
                    : "var(--bg-surface)",
                  color: inMonth
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                <span className="text-xs font-medium">{dayNum}</span>
                {ev && (
                  <span
                    className="mt-0.5 text-[9px] leading-tight"
                    style={{ color: "var(--event-text)" }}
                  >
                    {formatShiftStart(ev)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p
          className="text-center text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          칸의 시각은 내 근무 시작 시각입니다.
        </p>
      </div>
    </Modal>
  );
}

function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
