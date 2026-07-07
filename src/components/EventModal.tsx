"use client";

import { useState, type FormEvent } from "react";
import type { CalendarEvent, RecurrenceFrequency } from "@/lib/types";

const REPEAT_OPTIONS: { value: RecurrenceFrequency | "none"; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface EventModalProps {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

// 특정 날짜의 이벤트 목록을 보여주고, 새 이벤트 추가/기존 이벤트 수정/삭제를 처리하는 모달.
export default function EventModal({
  date,
  events,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // 수정 중인 일정의 원래 시작일(anchor date). 반복 일정은 이 날짜를 기준으로 발생일이
  // 계산되므로, 시작일이 아닌 날짜의 발생 건을 수정할 때도 이 값을 그대로 유지해야 한다.
  const [editingAnchorDate, setEditingAnchorDate] = useState<string | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [repeat, setRepeat] = useState<RecurrenceFrequency | "none">("none");
  const [repeatUntil, setRepeatUntil] = useState("");

  // 입력 폼 상태를 초기화하고 수정 모드를 해제한다(새 이벤트 입력 상태로 되돌림).
  function resetForm() {
    setEditingId(null);
    setEditingAnchorDate(null);
    setTitle("");
    setTime("");
    setDescription("");
    setRepeat("none");
    setRepeatUntil("");
  }

  // 선택한 기존 이벤트의 값들을 폼에 채워 넣어 수정 모드로 전환한다.
  function startEdit(event: CalendarEvent) {
    setEditingId(event.id);
    setEditingAnchorDate(event.date);
    setTitle(event.title);
    setTime(event.time ?? "");
    setDescription(event.description ?? "");
    setRepeat(event.repeat ?? "none");
    setRepeatUntil(event.repeatUntil ?? "");
  }

  // 폼 제출 처리. 제목이 비어 있으면 무시하고, 수정 모드면 기존 id와 원래 시작일을,
  // 아니면 새 UUID와 현재 열려 있는 날짜를 사용해 onSave를 호출한 뒤 폼을 초기화한다.
  // 반복 일정의 수정/삭제는 시리즈 전체에 적용된다(개별 발생일만 수정하는 기능은 없음).
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingId ?? crypto.randomUUID(),
      date: editingId ? editingAnchorDate ?? date : date,
      title: title.trim(),
      time: time || undefined,
      description: description.trim() || undefined,
      repeat: repeat === "none" ? undefined : repeat,
      repeatUntil: repeat !== "none" && repeatUntil ? repeatUntil : undefined,
    });
    resetForm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-background text-foreground border border-black/10 dark:border-white/15 shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{date}</h2>
          <button
            onClick={onClose}
            className="text-sm opacity-60 hover:opacity-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {events.length > 0 && (
          <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-2 rounded border border-black/10 dark:border-white/15 px-3 py-2 text-sm"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => startEdit(ev)}
                >
                  {ev.repeat && <span className="mr-1" title="Repeats">↻</span>}
                  <span className="font-medium">{ev.title}</span>
                  {ev.time && (
                    <span className="ml-2 opacity-60">{ev.time}</span>
                  )}
                </button>
                <button
                  onClick={() => onDelete(ev.id)}
                  className="opacity-60 hover:opacity-100 hover:text-red-500"
                  aria-label="Delete event"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
            required
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
          />
          <select
            value={repeat}
            onChange={(e) =>
              setRepeat(e.target.value as RecurrenceFrequency | "none")
            }
            className="w-full rounded border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
          >
            {REPEAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {repeat !== "none" && (
            <label className="block text-xs opacity-60">
              Repeat until (optional)
              <input
                type="date"
                value={repeatUntil}
                onChange={(e) => setRepeatUntil(e.target.value)}
                className="mt-1 w-full rounded border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
              />
            </label>
          )}
          <div className="flex justify-end gap-2 pt-1">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-sm rounded opacity-70 hover:opacity-100"
              >
                Cancel edit
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 text-sm rounded bg-foreground text-background hover:opacity-90"
            >
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
