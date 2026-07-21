"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
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
import { useLanguage } from "@/lib/useLanguage";
import {
  MONTH_TRANSITION_MS,
  SWIPE_THRESHOLD_PX,
  buildMonthGrid,
  buildWeekRange,
  collectEventsForDate,
  eventMatchesQuery,
  eventOccursOnDate,
  shiftDateKey,
  toDateKey,
  type OwnedEvent,
} from "@/lib/calendarLogic";
import CalendarView from "./CalendarView";
import SearchPanel from "./SearchPanel";
import SettingsPanel from "./SettingsPanel";
import MobileTabBar, { type MobileTab } from "./MobileTabBar";
import EventModal from "./EventModal";
import ShareModal from "./ShareModal";
import ActivityLogModal from "./ActivityLogModal";

export type { OwnedEvent };

interface CalendarProps {
  initialEvents: CalendarEvent[];
  calendars: CalendarSummary[];
  currentUserId: string;
  currentUsername: string;
}

// 달력 화면 전체를 담당하는 컨테이너 컴포넌트.
// 상태와 서버 액션 호출은 모두 여기서 관리하고, 실제 화면은 CalendarView/SearchPanel/
// SettingsPanel 세 패널로 분리해 렌더링한다. 모바일(sm 미만)에서는 activeTab에 따라
// 세 패널 중 하나만 보이고 하단 탭 바가 뜨며, 데스크톱(sm 이상)에서는 세 패널이 항상
// 모두 노출되는 기존 레이아웃을 그대로 유지한다(뷰 분기는 Tailwind sm: 클래스만으로 처리).
export default function Calendar({
  initialEvents,
  calendars,
  currentUserId,
  currentUsername,
}: CalendarProps) {
  const today = new Date();
  const todayKey = toDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  // "월"/"주" 뷰 전환 상태와, 주간 뷰가 기준으로 삼는 날짜(그 날짜가 속한 주를 보여준다).
  const [view, setView] = useState<"month" | "week">("month");
  const [weekAnchorDate, setWeekAnchorDate] = useState(todayKey);
  // 모바일 하단 탭 상태. 데스크톱에서는 사용되지 않는다(세 패널이 항상 노출됨).
  const [activeTab, setActiveTab] = useState<MobileTab>("calendar");
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
  const [activityLogOwnerId, setActivityLogOwnerId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  // 월 그리드 슬라이드 전환 상태. slideDirection은 새 그리드가 어느 쪽에서 밀려 들어오는지,
  // gridEntered는 그 그리드가 최종 위치(translate-x-0)에 도달했는지를 나타낸다.
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left"
  );
  const [gridEntered, setGridEntered] = useState(true);
  const [isMonthTransitioning, setIsMonthTransitioning] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
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

  // 알림이 설정된 일정을 위해 브라우저 알림 권한을 요청한다(최초 1회, 이미 결정된 경우는 건드리지 않음).
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 발생 인스턴스가 실체화되지 않으므로, 매 tick마다 오늘 발생하는 이벤트를 직접 계산해
  // 알림 시각이 지났는지 확인한다. 이미 알린 발생(occurrence)은 notifiedRef에 기록해 중복 알림을 막는다.
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    function checkReminders() {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const nowKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
      for (const ev of events) {
        if (ev.reminderMinutesBefore == null || !ev.time) continue;
        if (!eventOccursOnDate(ev, nowKey)) continue;
        const [hh, mm] = ev.time.split(":").map(Number);
        const eventTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hh,
          mm
        );
        const reminderTime = new Date(
          eventTime.getTime() - ev.reminderMinutesBefore * 60_000
        );
        const notifyKey = `${ev.id}-${nowKey}`;
        if (
          now >= reminderTime &&
          now < eventTime &&
          !notifiedRef.current.has(notifyKey)
        ) {
          notifiedRef.current.add(notifyKey);
          new Notification(ev.title, {
            body: [ev.time, ev.description].filter(Boolean).join(" · "),
          });
        }
      }
    }
    checkReminders();
    const interval = setInterval(checkReminders, 30_000);
    return () => clearInterval(interval);
  }, [events]);

  // 현재 연/월에 맞는 달력 그리드 셀 목록을 계산한다.
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // year/month가 바뀔 때마다(월 전환 시) 그리드를 슬라이드 오프셋 위치에서 시작해
  // 다음 프레임에 제자리로 애니메이션시키고, 전환 시간이 지나면 잠금을 해제한다.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setGridEntered(true));
    const timeout = setTimeout(
      () => setIsMonthTransitioning(false),
      MONTH_TRANSITION_MS
    );
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [year, month]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // 검색어가 있으면 제목/설명이 일치하는 이벤트만 남긴 풀. 월간/주간 뷰 모두 이 풀을 사용한다.
  const searchPool = useMemo(
    () =>
      trimmedQuery
        ? events.filter((ev) => eventMatchesQuery(ev, trimmedQuery))
        : events,
    [events, trimmedQuery]
  );

  // 그리드에 보이는 각 날짜에 대해 그날 발생하는 일정(반복 발생 포함)을 날짜별 Map으로
  // 그룹화한다(월간 뷰용). 주간 뷰는 collectEventsForDate를 날짜마다 직접 호출한다.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, OwnedEvent[]>();
    for (const cell of cells) {
      const matches = collectEventsForDate(searchPool, cell.dateKey);
      if (matches.length > 0) map.set(cell.dateKey, matches);
    }
    return map;
  }, [cells, searchPool]);

  // 현재 weekAnchorDate가 속한 주(일~토) 7일. 주간 뷰 그리드 생성에 사용한다.
  const weekDates = useMemo(
    () => buildWeekRange(weekAnchorDate),
    [weekAnchorDate]
  );

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

  // 검색 결과를 클릭하면 해당 이벤트의 시작 월/주로 이동하고 그 날짜의 모달을 연다.
  function jumpToEvent(event: CalendarEvent) {
    const [y, m] = event.date.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
    setWeekAnchorDate(event.date);
    setSelectedDate(event.date);
    setSearchQuery("");
    setActiveTab("calendar");
  }

  // 이전 달로 이동한다. 1월이면 연도를 하나 줄이고 12월로 이동한다.
  // 전환 애니메이션이 재생 중이면 무시해 중복 전환을 막는다.
  function goToPrevMonth() {
    if (isMonthTransitioning) return;
    setIsMonthTransitioning(true);
    setSlideDirection("right");
    setGridEntered(false);
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  // 다음 달로 이동한다. 12월이면 연도를 하나 늘리고 1월로 이동한다.
  // 전환 애니메이션이 재생 중이면 무시해 중복 전환을 막는다.
  function goToNextMonth() {
    if (isMonthTransitioning) return;
    setIsMonthTransitioning(true);
    setSlideDirection("left");
    setGridEntered(false);
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // 날짜 그리드의 터치 스와이프 제스처: 왼쪽으로 스와이프하면 다음 달, 오른쪽이면 이전 달.
  function handleGridTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
  }

  function handleGridTouchMove(e: TouchEvent<HTMLDivElement>) {
    touchCurrentXRef.current = e.touches[0].clientX;
  }

  function handleGridTouchEnd() {
    const startX = touchStartXRef.current;
    const currentX = touchCurrentXRef.current;
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
    if (startX === null || currentX === null) return;
    const deltaX = currentX - startX;
    if (deltaX <= -SWIPE_THRESHOLD_PX) {
      goToNextMonth();
    } else if (deltaX >= SWIPE_THRESHOLD_PX) {
      goToPrevMonth();
    }
  }

  // 오늘이 속한 연/월과 오늘이 속한 주로 돌아간다(뷰와 무관하게 둘 다 갱신).
  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setWeekAnchorDate(todayKey);
  }

  // 이전 주로 이동한다(주간 뷰용).
  function goToPrevWeek() {
    setWeekAnchorDate((d) => shiftDateKey(d, -7));
  }

  // 다음 주로 이동한다(주간 뷰용).
  function goToNextWeek() {
    setWeekAnchorDate((d) => shiftDateKey(d, 7));
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

  // 각 패널의 모바일 가시성 클래스. 데스크톱(sm 이상)에서는 항상 노출하고,
  // 모바일에서는 activeTab과 일치할 때만 노출한다(뷰포트 감지 없이 CSS로만 분기).
  function tabVisibilityClass(tab: MobileTab) {
    return activeTab === tab ? "block sm:block" : "hidden sm:block";
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] sm:pb-4">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-background shadow-sm p-4 sm:p-6">
        <SettingsPanel
          className={tabVisibilityClass("settings")}
          calendars={calendars}
          selectedOwnerIds={selectedOwnerIds}
          isMerged={isMerged}
          calendarLabel={calendarLabel}
          calendarMarkColorClass={calendarMarkColorClass}
          toggleCalendar={toggleCalendar}
          calendarPickerOpen={calendarPickerOpen}
          onToggleCalendarPickerOpen={() => setCalendarPickerOpen((o) => !o)}
          calendarPickerRef={calendarPickerRef}
          currentUsername={currentUsername}
          isOwnCalendarSelected={isOwnCalendarSelected}
          onShareClick={() => setShareModalOpen(true)}
          onActivityLogClick={
            isMerged ? undefined : () => setActivityLogOwnerId(selectedOwnerIds[0])
          }
          onLogout={handleLogout}
          language={language}
          t={t}
        />

        <SearchPanel
          className={tabVisibilityClass("search")}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          trimmedQuery={trimmedQuery}
          searchResults={searchResults}
          onJumpToEvent={jumpToEvent}
          t={t}
        />

        <CalendarView
          className={tabVisibilityClass("calendar")}
          view={view}
          onViewChange={setView}
          year={year}
          month={month}
          weekDates={weekDates}
          cells={cells}
          eventsByDate={eventsByDate}
          searchPool={searchPool}
          todayKey={todayKey}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          trimmedQuery={trimmedQuery}
          isMerged={isMerged}
          calendarMarkColorClass={calendarMarkColorClass}
          goToPrevMonth={goToPrevMonth}
          goToNextMonth={goToNextMonth}
          goToPrevWeek={goToPrevWeek}
          goToNextWeek={goToNextWeek}
          goToToday={goToToday}
          gridEntered={gridEntered}
          slideDirection={slideDirection}
          onGridTouchStart={handleGridTouchStart}
          onGridTouchMove={handleGridTouchMove}
          onGridTouchEnd={handleGridTouchEnd}
          t={t}
        />
      </div>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {selectedDate && (
        <EventModal
          date={selectedDate}
          events={collectEventsForDate(searchPool, selectedDate)}
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

      {activityLogOwnerId && (
        <ActivityLogModal
          ownerId={activityLogOwnerId}
          onClose={() => setActivityLogOwnerId(null)}
          t={t}
        />
      )}
    </div>
  );
}
