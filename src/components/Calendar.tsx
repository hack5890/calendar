"use client";

import { useMemo, useState } from "react";
import {
  deleteEvent as deleteEventAction,
  saveEvent as saveEventAction,
} from "@/lib/actions";
import type { CalendarEvent } from "@/lib/types";
import EventModal from "./EventModal";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 연/월/일을 "YYYY-MM-DD" 형식의 문자열 키로 변환한다. (month는 0부터 시작하는 인덱스)
function toDateKey(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// 달력 한 달치 그리드(6주 x 7일 = 42칸)를 생성한다.
// 해당 월의 1일이 시작되는 요일만큼 이전 달의 날짜로 앞을 채우고,
// 이번 달 날짜를 채운 뒤, 42칸이 될 때까지 다음 달 날짜로 뒤를 채운다.
function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; dateKey: string; inMonth: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = month - 1;
    const y = m < 0 ? year - 1 : year;
    const normM = (m + 12) % 12;
    cells.push({ day, dateKey: toDateKey(y, normM, day), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateKey: toDateKey(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const [y, m, d] = last.dateKey.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    cells.push({
      day: next.getDate(),
      dateKey: toDateKey(next.getFullYear(), next.getMonth(), next.getDate()),
      inMonth: false,
    });
  }

  return cells;
}

// 일정이 주어진 날짜(dateKey)에 발생하는지 판단한다.
// 반복이 없으면 시작일과 정확히 같은 날만, 반복이 있으면 시작일 이후(및 종료일 이전) 중
// 반복 주기에 맞는 날짜에 발생한다고 본다.
function eventOccursOnDate(event: CalendarEvent, dateKey: string): boolean {
  if (dateKey < event.date) return false;
  if (event.repeatUntil && dateKey > event.repeatUntil) return false;
  if (dateKey === event.date) return true;
  if (!event.repeat) return false;

  const [sy, sm, sd] = event.date.split("-").map(Number);
  const [ty, tm, td] = dateKey.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const target = new Date(ty, tm - 1, td);

  switch (event.repeat) {
    case "daily":
      return true;
    case "weekly": {
      const diffDays = Math.round(
        (target.getTime() - start.getTime()) / 86_400_000
      );
      return diffDays % 7 === 0;
    }
    case "monthly":
      return td === sd;
    case "yearly":
      return td === sd && tm === sm;
    default:
      return false;
  }
}

interface CalendarProps {
  initialEvents: CalendarEvent[];
}

// 달력 화면 전체를 담당하는 메인 컴포넌트.
// 현재 연/월 상태, 서버에서 불러온 이벤트 목록, 선택된 날짜(모달 표시용)를 관리한다.
export default function Calendar({ initialEvents }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 현재 연/월에 맞는 달력 그리드 셀 목록을 계산한다.
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // 그리드에 보이는 각 날짜에 대해 그날 발생하는 일정(반복 발생 포함)을 모아
  // 날짜별 Map으로 그룹화하고, 각 날짜 안에서는 시간순으로 정렬한다.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const cell of cells) {
      const matches = events.filter((ev) =>
        eventOccursOnDate(ev, cell.dateKey)
      );
      if (matches.length === 0) continue;
      matches.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
      map.set(cell.dateKey, matches);
    }
    return map;
  }, [events, cells]);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // 이전 달로 이동한다. 1월이면 연도를 하나 줄이고 12월로 이동한다.
  function goToPrevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  // 다음 달로 이동한다. 12월이면 연도를 하나 늘리고 1월로 이동한다.
  function goToNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // 오늘이 속한 연/월로 돌아간다.
  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  // 로컬 상태를 먼저 갱신해 화면에 즉시 반영하고, 서버 액션으로 DB에 저장한다.
  async function handleSave(event: CalendarEvent) {
    setEvents((prev) => [...prev.filter((e) => e.id !== event.id), event]);
    await saveEventAction(event);
  }

  // 로컬 상태에서 먼저 제거하고, 서버 액션으로 DB에서도 삭제한다.
  async function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await deleteEventAction(id);
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">
          {new Date(year, month).toLocaleString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="px-2.5 py-1.5 text-sm rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 text-sm rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="px-2.5 py-1.5 text-sm rounded border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium opacity-60 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ day, dateKey, inMonth }) => {
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              className={[
                "aspect-square sm:aspect-auto sm:h-24 flex flex-col items-start p-1.5 rounded border text-left overflow-hidden",
                "border-black/10 dark:border-white/15",
                inMonth ? "" : "opacity-35",
                isToday ? "ring-2 ring-offset-1 ring-black/50 dark:ring-white/50" : "",
                "hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              <span className="text-xs font-medium">{day}</span>
              <div className="mt-0.5 w-full space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="truncate text-[10px] leading-tight rounded bg-foreground/10 px-1 py-0.5"
                  >
                    {ev.repeat ? "↻ " : ""}
                    {ev.time ? `${ev.time} ` : ""}
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] opacity-60">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <EventModal
          date={selectedDate}
          events={eventsByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
