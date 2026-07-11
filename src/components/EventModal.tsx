"use client";

import { useState, type FormEvent } from "react";
import type { CalendarEvent, RecurrenceFrequency } from "@/lib/types";
import type { CalendarSummary } from "@/lib/actions";
import type { OwnedEvent } from "./Calendar";
import type { Translations } from "@/lib/i18n";
import { EVENT_COLORS, EVENT_COLOR_CLASSES, type EventColor } from "@/lib/eventColors";

const REPEAT_ORDER: (RecurrenceFrequency | "none")[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

interface EventModalProps {
  date: string;
  events: OwnedEvent[];
  // 현재 사용자가 편집 권한을 가진 캘린더의 ownerId 집합. 일정별 수정/삭제 버튼 노출에 쓰인다.
  editableOwnerIds: Set<string>;
  // 새 일정을 저장할 수 있는 후보 캘린더 목록 (겹쳐보기 중 편집 권한이 있는 캘린더들).
  targetCalendars: CalendarSummary[];
  defaultOwnerId?: string;
  // 캘린더를 둘 이상 겹쳐보는 중인지 여부. true면 일정마다 소속 캘린더 배지를 보여준다.
  isMerged: boolean;
  calendarLabel: (ownerId: string) => string;
  calendarMarkColorClass: (ownerId: string) => string;
  onClose: () => void;
  onSave: (event: CalendarEvent, ownerId: string) => void;
  onDelete: (id: string, ownerId: string) => void;
  t: Translations;
}

// 특정 날짜의 이벤트 목록을 보여주고, 새 이벤트 추가/기존 이벤트 수정/삭제를 처리하는 모달.
// 겹쳐보기 중에는 일정마다 소속 캘린더가 다를 수 있으므로, 수정/삭제 가능 여부는 그 일정의
// ownerId가 editableOwnerIds에 포함되는지로 판단한다. 새 일정은 targetCalendars 중 하나를
// 선택해 저장한다(편집 권한이 있는 캘린더가 하나뿐이면 선택 UI 없이 그 캘린더로 저장).
export default function EventModal({
  date,
  events,
  editableOwnerIds,
  targetCalendars,
  defaultOwnerId,
  isMerged,
  calendarLabel,
  calendarMarkColorClass,
  onClose,
  onSave,
  onDelete,
  t,
}: EventModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // 수정 중인 일정의 원래 시작일(anchor date). 반복 일정은 이 날짜를 기준으로 발생일이
  // 계산되므로, 시작일이 아닌 날짜의 발생 건을 수정할 때도 이 값을 그대로 유지해야 한다.
  const [editingAnchorDate, setEditingAnchorDate] = useState<string | null>(
    null
  );
  // 수정 중인 일정이 속한 캘린더. 새 일정 작성 중에는 targetOwnerId(선택된 대상 캘린더)를 쓴다.
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [targetOwnerId, setTargetOwnerId] = useState<string | undefined>(
    defaultOwnerId
  );
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [repeat, setRepeat] = useState<RecurrenceFrequency | "none">("none");
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [color, setColor] = useState<EventColor | undefined>(undefined);
  // 삭제 확인 모달에 표시할 대상 이벤트 (null이면 확인 모달을 띄우지 않음).
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    ownerId: string;
  } | null>(null);
  const canAddNew = targetCalendars.length > 0;

  // 입력 폼 상태를 초기화하고 수정 모드를 해제한다(새 이벤트 입력 상태로 되돌림).
  function resetForm() {
    setEditingId(null);
    setEditingAnchorDate(null);
    setEditingOwnerId(null);
    setTitle("");
    setTime("");
    setDescription("");
    setRepeat("none");
    setRepeatInterval(1);
    setRepeatUntil("");
    setColor(undefined);
  }

  // 선택한 기존 이벤트의 값들을 폼에 채워 넣어 수정 모드로 전환한다.
  function startEdit(event: OwnedEvent) {
    setEditingId(event.id);
    setEditingAnchorDate(event.date);
    setEditingOwnerId(event.ownerId);
    setTitle(event.title);
    setTime(event.time ?? "");
    setDescription(event.description ?? "");
    setRepeat(event.repeat ?? "none");
    setRepeatInterval(event.repeatInterval ?? 1);
    setRepeatUntil(event.repeatUntil ?? "");
    setColor(event.color);
  }

  // 폼 제출 처리. 제목이 비어 있으면 무시하고, 수정 모드면 기존 id와 원래 시작일 및 소속 캘린더를,
  // 아니면 새 UUID와 현재 열려 있는 날짜, 선택한 대상 캘린더(targetOwnerId)를 사용해 onSave를 호출한다.
  // 반복 일정의 수정/삭제는 시리즈 전체에 적용된다(개별 발생일만 수정하는 기능은 없음).
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const ownerId = editingId ? editingOwnerId : targetOwnerId;
    if (!ownerId) return;
    onSave(
      {
        id: editingId ?? crypto.randomUUID(),
        date: editingId ? editingAnchorDate ?? date : date,
        title: title.trim(),
        time: time || undefined,
        description: description.trim() || undefined,
        repeat: repeat === "none" ? undefined : repeat,
        repeatInterval: repeat !== "none" ? repeatInterval : undefined,
        repeatUntil: repeat !== "none" && repeatUntil ? repeatUntil : undefined,
        color,
      },
      ownerId
    );
    resetForm();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-xl bg-background text-foreground border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1.5 bg-accent" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{date}</h2>
              <button
                onClick={onClose}
                className="text-sm opacity-60 hover:opacity-100 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label={t.close}
              >
                ✕
              </button>
            </div>

            {events.length > 0 && (
              <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {events.map((ev) => {
                  const canEditThis = editableOwnerIds.has(ev.ownerId);
                  return (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-black/10 dark:border-white/15 px-3 py-2 text-sm hover:border-accent/40 transition-colors"
                  >
                    <button
                      type="button"
                      className={
                        "flex-1 text-left" +
                        (canEditThis ? "" : " cursor-default")
                      }
                      onClick={() => canEditThis && startEdit(ev)}
                    >
                      {isMerged && (
                        <span
                          className={[
                            "inline-block w-2 h-2 rounded-full mr-1.5 align-middle",
                            calendarMarkColorClass(ev.ownerId),
                          ].join(" ")}
                          title={calendarLabel(ev.ownerId)}
                        />
                      )}
                      {ev.color && (
                        <span
                          className={[
                            "inline-block w-2 h-2 rounded-full mr-1.5 align-middle",
                            EVENT_COLOR_CLASSES[ev.color].dot,
                          ].join(" ")}
                          title={t.colorNames[ev.color]}
                        />
                      )}
                      {ev.repeat && (
                        <span
                          className="mr-1 text-repeat-accent"
                          title={`${t.repeatEvery} ${
                            ev.repeatInterval ?? 1
                          } ${t.repeatUnits[ev.repeat]}`}
                        >
                          ↻
                        </span>
                      )}
                      <span className="font-medium">{ev.title}</span>
                      {ev.repeat && (ev.repeatInterval ?? 1) > 1 && (
                        <span className="ml-2 text-[11px] text-repeat-accent">
                          {t.repeatEvery} {ev.repeatInterval}{" "}
                          {t.repeatUnits[ev.repeat]}
                        </span>
                      )}
                      {ev.time && (
                        <span className="ml-2 text-accent">{ev.time}</span>
                      )}
                      {isMerged && (
                        <span className="ml-2 text-[11px] opacity-60">
                          {calendarLabel(ev.ownerId)}
                        </span>
                      )}
                    </button>
                    {canEditThis && (
                      <button
                        onClick={() =>
                          setConfirmDelete({ id: ev.id, ownerId: ev.ownerId })
                        }
                        className="opacity-60 hover:opacity-100 hover:text-red-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                        aria-label={t.deleteEvent}
                      >
                        🗑
                      </button>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}

            {canAddNew && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {isMerged && !editingId && targetCalendars.length > 1 && (
                <label className="block text-xs opacity-60">
                  {t.targetCalendarLabel}
                  <select
                    value={targetOwnerId}
                    onChange={(e) => setTargetOwnerId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {targetCalendars.map((c) => (
                      <option key={c.ownerId} value={c.ownerId}>
                        {calendarLabel(c.ownerId)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <input
                type="text"
                placeholder={t.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <textarea
                placeholder={t.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <div>
                <span className="block text-xs opacity-60 mb-1">{t.color}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColor(undefined)}
                    aria-label={t.colorNone}
                    aria-pressed={color === undefined}
                    className={[
                      "w-6 h-6 rounded-full border border-black/20 dark:border-white/25 flex items-center justify-center text-[10px] opacity-70 hover:opacity-100 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      color === undefined ? "ring-2 ring-offset-1 ring-accent" : "",
                    ].join(" ")}
                  >
                    ✕
                  </button>
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={t.colorNames[c]}
                      aria-pressed={color === c}
                      title={t.colorNames[c]}
                      className={[
                        "w-6 h-6 rounded-full transition-transform outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        EVENT_COLOR_CLASSES[c].dot,
                        color === c
                          ? "ring-2 ring-offset-1 ring-black/40 dark:ring-white/60 scale-110"
                          : "hover:scale-110",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
              <select
                value={repeat}
                onChange={(e) =>
                  setRepeat(e.target.value as RecurrenceFrequency | "none")
                }
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {REPEAT_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {t.repeatOptions[value]}
                  </option>
                ))}
              </select>
              {repeat !== "none" && (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="opacity-60">{t.repeatEvery}</span>
                    <input
                      type="number"
                      min={1}
                      value={repeatInterval}
                      onChange={(e) =>
                        setRepeatInterval(
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                      className="w-16 rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <span className="opacity-60">
                      {t.repeatUnits[repeat]}
                    </span>
                  </div>
                  <label className="block text-xs opacity-60">
                    {t.repeatUntil}
                    <input
                      type="date"
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                </>
              )}
              <div className="flex justify-end gap-2 pt-1">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-sm rounded-lg opacity-70 hover:opacity-100"
                  >
                    {t.cancelEdit}
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  {editingId ? t.update : t.add}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-xs rounded-xl bg-background text-foreground border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-red-600" />
            <div className="p-5">
              <p className="text-sm mb-4">{t.confirmDelete}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-3 py-1.5 text-sm rounded-lg opacity-70 hover:opacity-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(confirmDelete.id, confirmDelete.ownerId);
                    setConfirmDelete(null);
                  }}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {t.deleteAction}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
