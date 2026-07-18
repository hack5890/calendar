import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as calendarsApi from "@/lib/api/calendars";
import { buildMonthGrid, eventOccursOnDate, type MonthGridCell } from "@/lib/calendarLogic";
import { useAuth } from "@/lib/auth/AuthContext";
import { EVENT_COLORS, EVENT_COLOR_CLASSES } from "@/lib/eventColors";
import type { CalendarSummary, OwnedEvent } from "@/lib/types";

interface CalendarContextValue {
  calendars: CalendarSummary[];
  selectedOwnerIds: string[];
  selectedCalendar: CalendarSummary | null;
  isMerged: boolean;
  isOwnSelected: boolean;
  editableCalendars: CalendarSummary[];
  editableOwnerIds: Set<string>;
  defaultTargetOwnerId: string | undefined;
  toggleCalendar: (ownerId: string) => void;
  calendarMarkColorClass: (ownerId: string) => string;
  year: number;
  month: number;
  cells: MonthGridCell[];
  goPrevMonth: () => void;
  goNextMonth: () => void;
  goToday: () => void;
  events: OwnedEvent[];
  eventsForDate: (dateKey: string) => OwnedEvent[];
  loading: boolean;
  refreshCalendars: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  saveEvent: (event: OwnedEvent, isEditing: boolean) => Promise<void>;
  deleteEvent: (id: string, ownerId: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [events, setEvents] = useState<OwnedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCalendars = useCallback(async () => {
    const list = await calendarsApi.getCalendars();
    setCalendars(list);
    setSelectedOwnerIds((prev) =>
      prev.length > 0 ? prev : [user?.id ?? list[0]?.ownerId].filter((id): id is string => Boolean(id))
    );
  }, [user?.id]);

  const refreshEvents = useCallback(async () => {
    if (selectedOwnerIds.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        selectedOwnerIds.map(async (ownerId) => {
          const list = await calendarsApi.getEvents(ownerId);
          return list.map((e) => ({ ...e, ownerId }));
        })
      );
      setEvents(results.flat());
    } finally {
      setLoading(false);
    }
  }, [selectedOwnerIds]);

  // 마운트 시(및 selectedOwnerIds 변경 시) 1회 데이터 로드 — 표준 fetch-on-mount 패턴.
  useEffect(() => {
    refreshCalendars();
  }, [refreshCalendars]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // 겹쳐볼 캘린더를 켜고 끈다. 최소 하나는 항상 선택돼 있어야 한다.
  // src/components/Calendar.tsx의 toggleCalendar와 동일한 규칙.
  function toggleCalendar(ownerId: string) {
    setSelectedOwnerIds((prev) => {
      const next = prev.includes(ownerId)
        ? prev.filter((id) => id !== ownerId)
        : [...prev, ownerId];
      return next.length === 0 ? prev : next;
    });
  }

  function goPrevMonth() {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function goToday() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const eventsForDate = useCallback(
    (dateKey: string) => {
      return events
        .filter((ev) => eventOccursOnDate(ev, dateKey))
        .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    },
    [events]
  );

  // 낙관적 업데이트: 로컬 상태를 먼저 갱신하고 API를 호출한다(실패해도 롤백하지 않음 —
  // 웹 버전 Calendar.tsx의 handleSave/handleDelete와 동일한 기존 동작을 유지).
  const saveEvent = useCallback(async (event: OwnedEvent, isEditing: boolean) => {
    setEvents((prev) => [...prev.filter((e) => e.id !== event.id), event]);
    if (isEditing) {
      await calendarsApi.updateEvent(event.ownerId, event);
    } else {
      await calendarsApi.createEvent(event.ownerId, event);
    }
  }, []);

  const deleteEvent = useCallback(async (id: string, ownerId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await calendarsApi.deleteEvent(ownerId, id);
  }, []);

  // 캘린더 고유 색상(마커): 겹쳐볼 때 어느 캘린더의 이벤트인지 구분하기 위한 표시.
  // src/components/Calendar.tsx의 calendarMarkColorClass와 동일한 규칙.
  const calendarMarkColorClass = useCallback(
    (ownerId: string) => {
      const idx = Math.max(0, calendars.findIndex((c) => c.ownerId === ownerId));
      return EVENT_COLOR_CLASSES[EVENT_COLORS[idx % EVENT_COLORS.length]].dot;
    },
    [calendars]
  );

  const isMerged = selectedOwnerIds.length > 1;
  const isOwnSelected =
    selectedOwnerIds.length === 1 && selectedOwnerIds[0] === user?.id;

  const editableCalendars = useMemo(
    () => calendars.filter((c) => selectedOwnerIds.includes(c.ownerId) && c.permission === "edit"),
    [calendars, selectedOwnerIds]
  );
  const editableOwnerIds = useMemo(
    () => new Set(editableCalendars.map((c) => c.ownerId)),
    [editableCalendars]
  );
  const defaultTargetOwnerId =
    user && editableOwnerIds.has(user.id) ? user.id : editableCalendars[0]?.ownerId;

  const selectedCalendar =
    selectedOwnerIds.length === 1
      ? calendars.find((c) => c.ownerId === selectedOwnerIds[0]) ?? null
      : null;

  const value: CalendarContextValue = {
    calendars,
    selectedOwnerIds,
    selectedCalendar,
    isMerged,
    isOwnSelected,
    editableCalendars,
    editableOwnerIds,
    defaultTargetOwnerId,
    toggleCalendar,
    calendarMarkColorClass,
    year,
    month,
    cells,
    goPrevMonth,
    goNextMonth,
    goToday,
    events,
    eventsForDate,
    loading,
    refreshCalendars,
    refreshEvents,
    saveEvent,
    deleteEvent,
  };

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
