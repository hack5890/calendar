"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteEvent as deleteEventAction,
  getAllEvents as getAllEventsAction,
  logout as logoutAction,
  saveEvent as saveEventAction,
  type CalendarSummary,
} from "@/lib/actions";
import type { CalendarEvent } from "@/lib/types";
import { EVENT_COLORS, EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import { getTranslations } from "@/lib/i18n";
import { setLanguage, useLanguage } from "@/lib/useLanguage";
import EventModal from "./EventModal";
import ShareModal from "./ShareModal";

// 여러 캘린더를 겹쳐볼 때, 각 이벤트가 어느 캘린더(owner) 소속인지 함께 들고 있는 형태.
export type OwnedEvent = CalendarEvent & { ownerId: string };

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
// 반복 주기 * 간격(repeatInterval, 기본 1)에 맞는 날짜에 발생한다고 본다.
function eventOccursOnDate(event: CalendarEvent, dateKey: string): boolean {
  if (dateKey < event.date) return false;
  if (event.repeatUntil && dateKey > event.repeatUntil) return false;
  if (dateKey === event.date) return true;
  if (!event.repeat) return false;

  const interval =
    event.repeatInterval && event.repeatInterval > 0
      ? event.repeatInterval
      : 1;
  const [sy, sm, sd] = event.date.split("-").map(Number);
  const [ty, tm, td] = dateKey.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const target = new Date(ty, tm - 1, td);

  switch (event.repeat) {
    case "daily": {
      const diffDays = Math.round(
        (target.getTime() - start.getTime()) / 86_400_000
      );
      return diffDays % interval === 0;
    }
    case "weekly": {
      const diffDays = Math.round(
        (target.getTime() - start.getTime()) / 86_400_000
      );
      if (diffDays % 7 !== 0) return false;
      return diffDays / 7 % interval === 0;
    }
    case "monthly": {
      if (td !== sd) return false;
      const diffMonths = (ty - sy) * 12 + (tm - sm);
      return diffMonths % interval === 0;
    }
    case "yearly": {
      if (td !== sd || tm !== sm) return false;
      return (ty - sy) % interval === 0;
    }
    default:
      return false;
  }
}

// 검색어가 이벤트의 제목 또는 설명에 (대소문자 구분 없이) 포함되는지 검사한다.
// query가 비어 있으면 항상 true(필터링 없음).
function eventMatchesQuery(event: CalendarEvent, query: string): boolean {
  if (!query) return true;
  return (
    event.title.toLowerCase().includes(query) ||
    (event.description ?? "").toLowerCase().includes(query)
  );
}

interface CalendarProps {
  initialEvents: CalendarEvent[];
  calendars: CalendarSummary[];
  currentUserId: string;
  currentUsername: string;
}

// 달력 화면 전체를 담당하는 메인 컴포넌트.
// 현재 연/월 상태, 서버에서 불러온 이벤트 목록, 선택된 날짜(모달 표시용)를 관리한다.
export default function Calendar({
  initialEvents,
  calendars,
  currentUserId,
  currentUsername,
}: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<OwnedEvent[]>(
    initialEvents.map((e) => ({ ...e, ownerId: currentUserId }))
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([
    currentUserId,
  ]);
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);
  const calendarPickerRef = useRef<HTMLDivElement | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const language = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);

  const isMerged = selectedOwnerIds.length > 1;
  // 선택된 캘린더들 중 편집 권한이 있는 캘린더 목록 (새 일정을 저장할 대상 후보).
  const editableCalendars = calendars.filter(
    (c) => selectedOwnerIds.includes(c.ownerId) && c.permission === "edit"
  );
  const editableOwnerIds = useMemo(
    () => new Set(editableCalendars.map((c) => c.ownerId)),
    [editableCalendars]
  );
  const isOwnCalendarSelected =
    selectedOwnerIds.length === 1 && selectedOwnerIds[0] === currentUserId;

  // 캘린더 고유 색상(마커): 겹쳐볼 때 어느 캘린더의 이벤트인지 구분하기 위한 표시.
  function calendarMarkColorClass(ownerId: string) {
    const idx = Math.max(
      0,
      calendars.findIndex((c) => c.ownerId === ownerId)
    );
    return EVENT_COLOR_CLASSES[EVENT_COLORS[idx % EVENT_COLORS.length]].dot;
  }

  function calendarLabel(ownerId: string) {
    const c = calendars.find((c) => c.ownerId === ownerId);
    if (!c) return "";
    return c.isOwn ? t.myCalendar : t.calendarOf(c.ownerUsername);
  }

  // 팝오버 바깥을 클릭하면 캘린더 선택 패널을 닫는다.
  useEffect(() => {
    if (!calendarPickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        calendarPickerRef.current &&
        !calendarPickerRef.current.contains(e.target as Node)
      ) {
        setCalendarPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarPickerOpen]);

  // 언어가 바뀔 때마다 <html lang>을 동기화한다(외부 DOM 상태 동기화이므로 이펙트로 처리).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // 현재 연/월에 맞는 달력 그리드 셀 목록을 계산한다.
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // 그리드에 보이는 각 날짜에 대해 그날 발생하는 일정(반복 발생 포함)을 모아
  // 날짜별 Map으로 그룹화하고, 각 날짜 안에서는 시간순으로 정렬한다.
  // 검색어가 있으면 제목/설명이 일치하는 이벤트만 대상으로 한다.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, OwnedEvent[]>();
    const pool = trimmedQuery
      ? events.filter((ev) => eventMatchesQuery(ev, trimmedQuery))
      : events;
    for (const cell of cells) {
      const matches = pool.filter((ev) => eventOccursOnDate(ev, cell.dateKey));
      if (matches.length === 0) continue;
      matches.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
      map.set(cell.dateKey, matches);
    }
    return map;
  }, [events, cells, trimmedQuery]);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // 검색어와 일치하는 이벤트를 시작일(anchor date) 기준으로 정렬해 상위 몇 개만 보여준다.
  // (반복 일정은 anchor date로 표시되며, 클릭 시 해당 월로 이동한다.)
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return events
      .filter((ev) => eventMatchesQuery(ev, trimmedQuery))
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [events, trimmedQuery]);

  // 검색 결과를 클릭하면 해당 이벤트의 시작 월로 이동하고 그 날짜의 모달을 연다.
  function jumpToEvent(event: CalendarEvent) {
    const [y, m] = event.date.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
    setSelectedDate(event.date);
    setSearchQuery("");
  }

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

  // 로컬 상태를 먼저 갱신해 화면에 즉시 반영하고, 서버 액션으로 해당 이벤트가 속한 캘린더에 저장한다.
  // ownerId는 겹쳐보기 중이면 새 일정 저장 대상 선택값을, 기존 일정 수정이면 그 일정의 원래 소유 캘린더를 가리킨다.
  async function handleSave(event: CalendarEvent, ownerId: string) {
    setEvents((prev) => [
      ...prev.filter((e) => e.id !== event.id),
      { ...event, ownerId },
    ]);
    await saveEventAction(event, ownerId);
  }

  // 로컬 상태에서 먼저 제거하고, 서버 액션으로 해당 캘린더에서도 삭제한다.
  async function handleDelete(id: string, ownerId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await deleteEventAction(id, ownerId);
  }

  // 주어진 캘린더 목록의 이벤트를 모두 불러와 소유자(ownerId) 태그를 붙여 합친다.
  async function refreshEvents(ownerIds: string[]) {
    const results = await Promise.all(
      ownerIds.map(async (ownerId) => {
        const list = await getAllEventsAction(ownerId);
        return list.map((e) => ({ ...e, ownerId }));
      })
    );
    setEvents(results.flat());
  }

  // 겹쳐볼 캘린더를 켜고 끈다. 최소 하나는 항상 선택돼 있어야 한다.
  async function toggleCalendar(ownerId: string) {
    const next = selectedOwnerIds.includes(ownerId)
      ? selectedOwnerIds.filter((id) => id !== ownerId)
      : [...selectedOwnerIds, ownerId];
    if (next.length === 0) return;
    setSelectedOwnerIds(next);
    setSelectedDate(null);
    await refreshEvents(next);
  }

  async function handleLogout() {
    await logoutAction();
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-background shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-black/10 dark:border-white/10 text-sm">
          <div className="relative" ref={calendarPickerRef}>
            <button
              type="button"
              onClick={() => setCalendarPickerOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 hover:border-accent/40"
            >
              {isMerged
                ? t.multipleCalendars(selectedOwnerIds.length)
                : calendarLabel(selectedOwnerIds[0])}
              <span className="opacity-50 text-xs">▾</span>
            </button>
            {calendarPickerOpen && (
              <div className="absolute z-20 mt-1 w-60 rounded-lg border border-black/10 dark:border-white/15 bg-background shadow-lg p-1.5 space-y-0.5">
                {calendars.map((c) => (
                  <label
                    key={c.ownerId}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOwnerIds.includes(c.ownerId)}
                      onChange={() => toggleCalendar(c.ownerId)}
                      className="accent-accent"
                    />
                    <span
                      className={[
                        "inline-block w-2 h-2 rounded-full shrink-0",
                        calendarMarkColorClass(c.ownerId),
                      ].join(" ")}
                    />
                    <span className="truncate">
                      {c.isOwn ? t.myCalendar : t.calendarOf(c.ownerUsername)}
                    </span>
                    {c.permission === "view" && (
                      <span className="ml-auto text-[10px] opacity-60 shrink-0">
                        {t.viewOnlyBadge}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs opacity-60">{currentUsername}</span>
            {isOwnCalendarSelected && (
              <button
                onClick={() => setShareModalOpen(true)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t.share}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t.logout}
            </button>
          </div>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-1.5 pr-8 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t.clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              ✕
            </button>
          )}
          {trimmedQuery && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-background shadow-lg max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="px-3 py-2 text-sm opacity-60">
                  {t.noSearchResults}
                </p>
              ) : (
                searchResults.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => jumpToEvent(ev)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-accent/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="truncate">
                      {ev.color && (
                        <span
                          className={[
                            "inline-block w-2 h-2 rounded-full mr-1.5 align-middle",
                            EVENT_COLOR_CLASSES[ev.color].dot,
                          ].join(" ")}
                        />
                      )}
                      {ev.title}
                    </span>
                    <span className="text-xs opacity-60 shrink-0">
                      {ev.date}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {new Date(year, month).toLocaleString(t.locale, {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={t.prevMonth}
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t.today}
            </button>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={t.nextMonth}
            >
              →
            </button>
            <div className="ml-1.5 flex rounded-lg border border-black/10 dark:border-white/15 overflow-hidden text-sm">
              <button
                onClick={() => setLanguage("en")}
                className={
                  "px-2.5 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                  (language === "en"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/10")
                }
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ko")}
                className={
                  "px-2.5 py-1.5 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                  (language === "ko"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/10")
                }
              >
                한국어
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
          {t.weekdays.map((d, i) => (
            <div
              key={d}
              className={[
                "py-1",
                i === 0
                  ? "text-red-500 dark:text-red-400"
                  : i === 6
                    ? "text-blue-500 dark:text-blue-400"
                    : "opacity-60",
              ].join(" ")}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map(({ day, dateKey, inMonth }, index) => {
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            const isToday = dateKey === todayKey;
            const isSearchMatch = trimmedQuery.length > 0 && dayEvents.length > 0;
            const isSelected = dateKey === selectedDate;
            const weekdayIndex = index % 7;
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={[
                  "aspect-square sm:aspect-auto sm:h-24 flex flex-col items-start p-1.5 rounded-lg border text-left overflow-hidden transition-colors",
                  isSelected ? "border-accent bg-accent/10" : "border-black/10 dark:border-white/15",
                  inMonth ? "" : "opacity-35",
                  isToday ? "ring-2 ring-offset-1 ring-accent" : "",
                  isSearchMatch && !isToday ? "ring-2 ring-offset-1 ring-accent/50" : "",
                  "hover:bg-accent/5 hover:border-accent/30",
                  "outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-accent text-accent-foreground"
                      : weekdayIndex === 0
                        ? "text-red-500 dark:text-red-400"
                        : weekdayIndex === 6
                          ? "text-blue-500 dark:text-blue-400"
                          : "",
                  ].join(" ")}
                >
                  {day}
                </span>
                <div className="mt-0.5 w-full space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={[
                        "truncate text-[10px] leading-tight rounded px-1 py-0.5",
                        ev.color
                          ? EVENT_COLOR_CLASSES[ev.color].pill
                          : ev.repeat
                            ? "bg-repeat-accent/15 text-repeat-accent"
                            : "bg-accent/10 text-accent",
                      ].join(" ")}
                    >
                      {isMerged && (
                        <span
                          className={[
                            "inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle shrink-0",
                            calendarMarkColorClass(ev.ownerId),
                          ].join(" ")}
                        />
                      )}
                      {ev.repeat ? "↻ " : ""}
                      {ev.time ? `${ev.time} ` : ""}
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] opacity-60">
                      {t.more(dayEvents.length - 2)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <EventModal
          date={selectedDate}
          events={eventsByDate.get(selectedDate) ?? []}
          editableOwnerIds={editableOwnerIds}
          targetCalendars={editableCalendars}
          defaultOwnerId={
            editableOwnerIds.has(currentUserId)
              ? currentUserId
              : editableCalendars[0]?.ownerId
          }
          isMerged={isMerged}
          calendarLabel={calendarLabel}
          calendarMarkColorClass={calendarMarkColorClass}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          t={t}
        />
      )}

      {shareModalOpen && (
        <ShareModal onClose={() => setShareModalOpen(false)} t={t} />
      )}
    </div>
  );
}
