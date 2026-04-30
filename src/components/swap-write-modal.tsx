"use client";

import {
  CalendarWindow,
  createThreeMonthWindow,
  getCalendarWindowEventRange,
} from "@/lib/calendar-window";
import Modal from "@/components/modal";
import SwapDatePickerModal from "@/components/swap-date-picker-modal";
import SwapShiftTimePickerModal from "@/components/swap-shift-time-picker-modal";
import SwapTeamPickerModal from "@/components/swap-team-picker-modal";
import { useToast } from "@/components/toast-provider";
import { loadShiftEventsByDateRange } from "@/lib/shift-calendar-client";
import {
  formatShiftRange,
  formatSwapDateShort,
  getSeoulDateKey,
} from "@/lib/time";
import { SwapEvent, TeamLite } from "@/lib/types";
import {
  buildOffRequestTitle,
  buildWorkRequestTitle,
  formatDesiredShiftSummary,
  formatSelectedTeams,
  isSameMondayWeek,
  ShiftRequestType,
} from "@/lib/swap-board";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

interface WriteModalProps {
  boardSlug: string;
  myTeams: TeamLite[];
  onClose: () => void;
  onCreated: () => void;
}

export default function SwapWriteModal({
  boardSlug,
  myTeams,
  onClose,
  onCreated,
}: WriteModalProps) {
  const today = useMemo(() => getSeoulDateKey(new Date()), []);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    myTeams[0]?.id ? [myTeams[0].id] : []
  );
  const [pickingTeam, setPickingTeam] = useState(false);
  const [requestType, setRequestType] = useState<ShiftRequestType>("work");
  const [workDate, setWorkDate] = useState("");
  const [selectedDesiredShifts, setSelectedDesiredShifts] = useState<string[]>(
    []
  );
  const [myOffDate, setMyOffDate] = useState("");
  const [desiredOffDate, setDesiredOffDate] = useState("");
  const [desiredOffEvent, setDesiredOffEvent] = useState<SwapEvent | null>(
    null
  );
  const [body, setBody] = useState("");
  const [pickingWorkDate, setPickingWorkDate] = useState(false);
  const [pickingMyOffDate, setPickingMyOffDate] = useState(false);
  const [pickingDesiredOffDate, setPickingDesiredOffDate] = useState(false);
  const [pickingDesiredShifts, setPickingDesiredShifts] = useState(false);
  const [prefetchedEventsByDate, setPrefetchedEventsByDate] = useState<
    Map<string, SwapEvent>
  >(new Map());
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const calendarWindow = useMemo<CalendarWindow>(
    () => createThreeMonthWindow(new Date()),
    []
  );

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getCalendarWindowEventRange(calendarWindow);

    loadShiftEventsByDateRange(from, to)
      .then((eventMap) => {
        if (!cancelled) {
          setPrefetchedEventsByDate(eventMap);
        }
      })
      .catch(() => {
        // no-op
      });

    return () => {
      cancelled = true;
    };
  }, [calendarWindow]);

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--input-text)",
    "--tw-ring-color": "var(--primary)",
  } as CSSProperties;

  const currentSwapDate = requestType === "work" ? workDate : desiredOffDate;
  const selectedTeamNames = myTeams
    .filter((team) => selectedTeamIds.includes(team.id))
    .map((team) => team.name);
  const generatedTitle =
    requestType === "work"
      ? buildWorkRequestTitle(selectedDesiredShifts)
      : buildOffRequestTitle(myOffDate);
  const selectedWorkEvent = workDate
    ? prefetchedEventsByDate.get(workDate) ?? null
    : null;

  function resetTypeSpecificFields(next: ShiftRequestType) {
    setRequestType(next);
    setWorkDate("");
    setSelectedDesiredShifts([]);
    setMyOffDate("");
    setDesiredOffDate("");
    setDesiredOffEvent(null);
  }

  function pickMyOffDate(pickedDate: string) {
    setMyOffDate(pickedDate);

    if (desiredOffDate && !isSameMondayWeek(pickedDate, desiredOffDate)) {
      setDesiredOffDate("");
      setDesiredOffEvent(null);
    }
  }

  function buildPayloadBody() {
    const note = body.trim();

    if (requestType === "work") {
      const lines = [
        "근무 유형: 근무",
        `교환 날짜: ${formatSwapDateShort(workDate)}`,
        `찾는 근무: ${formatDesiredShiftSummary(selectedDesiredShifts)}`,
      ];
      return note ? `${lines.join("\n")}\n\n${note}` : lines.join("\n");
    }

    const lines = [
      "근무 유형: 휴무",
      `내 휴무 날짜: ${formatSwapDateShort(myOffDate)}`,
      `찾는 휴무 날짜: ${formatSwapDateShort(desiredOffDate)}`,
      `원하는 날짜의 내 근무: ${formatShiftRange(desiredOffEvent)}`,
    ];
    return note ? `${lines.join("\n")}\n\n${note}` : lines.join("\n");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (selectedTeamIds.length === 0) {
      toast.error("팀을 하나 이상 선택해주세요");
      return;
    }

    if (requestType === "work") {
      if (!workDate) {
        toast.error("교환할 날짜를 선택해주세요");
        return;
      }
      if (!selectedWorkEvent) {
        toast.error("내 근무가 있는 날짜를 선택해주세요");
        return;
      }
      if (selectedDesiredShifts.length === 0) {
        toast.error("찾는 근무를 하나 이상 선택해주세요");
        return;
      }
    }

    if (requestType === "off") {
      if (!myOffDate) {
        toast.error("내 휴무 날짜를 선택해주세요");
        return;
      }
      if (!desiredOffDate) {
        toast.error("찾는 휴무 날짜를 선택해주세요");
        return;
      }
      if (!isSameMondayWeek(myOffDate, desiredOffDate)) {
        toast.error("같은 주차의 날짜만 교환할 수 있어요");
        return;
      }
      if (myOffDate === desiredOffDate) {
        toast.error("서로 다른 날짜를 선택해주세요");
        return;
      }
    }

    setSubmitting(true);
    const response = await fetch(`/api/boards/${boardSlug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: generatedTitle,
        body: buildPayloadBody(),
        team_ids: selectedTeamIds,
        swap_date: currentSwapDate,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      toast.error(data.error || "등록에 실패했습니다");
      return;
    }

    onCreated();
  }

  return (
    <>
      <Modal title="근무 교환 글쓰기" onClose={onClose} maxWidth="max-w-lg">
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
              <>
                <button
                  type="button"
                  onClick={() => setPickingTeam(true)}
                  className="interactive-press w-full rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color:
                      selectedTeamNames.length > 0
                        ? "var(--input-text)"
                        : "var(--input-placeholder)",
                  }}
                >
                  {selectedTeamNames.length > 0
                    ? formatSelectedTeams(selectedTeamNames)
                    : "팀을 선택하세요"}
                </button>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  선택한 팀들의 구성원들이 내 글을 볼 수 있습니다.
                </p>
              </>
            )}
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              근무 유형
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "work" as const, label: "근무 교환" },
                { value: "off" as const, label: "휴무 교환" },
              ].map((option) => {
                const active = requestType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => resetTypeSpecificFields(option.value)}
                    className="interactive-press rounded-lg border px-3 py-2.5 text-sm font-medium"
                    style={{
                      borderColor: active
                        ? "var(--primary)"
                        : "var(--input-border)",
                      backgroundColor: active
                        ? "var(--primary)"
                        : "var(--bg-muted)",
                      color: active
                        ? "var(--text-on-primary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {requestType === "work" && (
            <>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  내 근무 날짜
                </label>
                <button
                  type="button"
                  onClick={() => setPickingWorkDate(true)}
                  className="interactive-press w-full rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: workDate
                      ? "var(--input-text)"
                      : "var(--input-placeholder)",
                  }}
                >
                  {workDate
                    ? `${formatSwapDateShort(workDate)}${
                        selectedWorkEvent
                          ? ` · ${formatShiftRange(selectedWorkEvent)}`
                          : ""
                      }`
                    : "날짜를 선택하세요"}
                </button>
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  찾는 근무
                </label>
                <button
                  type="button"
                  onClick={() => setPickingDesiredShifts(true)}
                  className="interactive-press w-full rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color:
                      selectedDesiredShifts.length > 0
                        ? "var(--input-text)"
                        : "var(--input-placeholder)",
                  }}
                >
                  {selectedDesiredShifts.length > 0
                    ? formatDesiredShiftSummary(selectedDesiredShifts)
                    : "찾는 근무를 선택하세요"}
                </button>
              </div>
            </>
          )}

          {requestType === "off" && (
            <>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  내 휴무 날짜
                </label>
                <button
                  type="button"
                  onClick={() => setPickingMyOffDate(true)}
                  className="interactive-press w-full rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: myOffDate
                      ? "var(--input-text)"
                      : "var(--input-placeholder)",
                  }}
                >
                  {myOffDate
                    ? `${formatSwapDateShort(myOffDate)} · 휴무`
                    : "내 휴무 날짜를 선택하세요"}
                </button>
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  찾는 휴무 날짜
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!myOffDate) {
                      toast.error("내 휴무 날짜를 먼저 선택해주세요");
                      return;
                    }
                    setPickingDesiredOffDate(true);
                  }}
                  className="interactive-press w-full rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: desiredOffDate
                      ? "var(--input-text)"
                      : "var(--input-placeholder)",
                  }}
                >
                  {desiredOffDate
                    ? `${formatSwapDateShort(desiredOffDate)}${
                        desiredOffEvent
                          ? ` · ${formatShiftRange(desiredOffEvent)}`
                          : ""
                      }`
                    : "찾는 휴무 날짜를 선택하세요"}
                </button>
              </div>
            </>
          )}

          <div>
            <label
              className="mb-1 block text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              내용
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="내용을 입력하세요."
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={
              submitting || myTeams.length === 0 || selectedTeamIds.length === 0
            }
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

      {pickingWorkDate && (
        <SwapDatePickerModal
          title="날짜 선택"
          initialDate={workDate || today}
          selectedDate={workDate}
          minDate={today}
          selectionMode="workOnly"
          calendarWindow={calendarWindow}
          eventsByDate={prefetchedEventsByDate}
          onCancel={() => setPickingWorkDate(false)}
          onPick={(pickedDate) => {
            setWorkDate(pickedDate);
            setPickingWorkDate(false);
          }}
        />
      )}

      {pickingMyOffDate && (
        <SwapDatePickerModal
          title="내 휴무 날짜 선택"
          initialDate={myOffDate || today}
          selectedDate={myOffDate}
          minDate={today}
          selectionMode="offOnly"
          calendarWindow={calendarWindow}
          eventsByDate={prefetchedEventsByDate}
          onCancel={() => setPickingMyOffDate(false)}
          onPick={(pickedDate) => {
            pickMyOffDate(pickedDate);
            setPickingMyOffDate(false);
          }}
        />
      )}

      {pickingDesiredOffDate && (
        <SwapDatePickerModal
          title="찾는 휴무 날짜 선택"
          initialDate={desiredOffDate || myOffDate || today}
          selectedDate={desiredOffDate}
          minDate={today}
          selectionMode="workOnly"
          sameWeekAnchorDate={myOffDate}
          calendarWindow={calendarWindow}
          eventsByDate={prefetchedEventsByDate}
          onCancel={() => setPickingDesiredOffDate(false)}
          onPick={(pickedDate, pickedEvent) => {
            setDesiredOffDate(pickedDate);
            setDesiredOffEvent(pickedEvent);
            setPickingDesiredOffDate(false);
          }}
        />
      )}

      {pickingDesiredShifts && (
        <SwapShiftTimePickerModal
          selectedTimes={selectedDesiredShifts}
          onCancel={() => setPickingDesiredShifts(false)}
          onConfirm={(times) => {
            setSelectedDesiredShifts(times);
            setPickingDesiredShifts(false);
          }}
        />
      )}

      {pickingTeam && (
        <SwapTeamPickerModal
          teams={myTeams}
          selectedTeamIds={selectedTeamIds}
          onCancel={() => setPickingTeam(false)}
          onConfirm={(nextTeamIds) => {
            setSelectedTeamIds(nextTeamIds);
            setPickingTeam(false);
          }}
        />
      )}
    </>
  );
}
