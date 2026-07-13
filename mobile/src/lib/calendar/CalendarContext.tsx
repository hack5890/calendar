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
import type { CalendarEvent, CalendarSummary } from "@/lib/types";

interface CalendarContextValue {
  calendars: CalendarSummary[];
  selectedOwnerId: string | null;
  selectedCalendar: CalendarSummary | null;
  isOwnSelected: boolean;
  canEdit: boolean;
  selectCalendar: (ownerId: string) => void;
  year: number;
  month: number;
  cells: MonthGridCell[];
  goPrevMonth: () => void;
  goNextMonth: () => void;
  goToday: () => void;
  events: CalendarEvent[];
  eventsForDate: (dateKey: string) => CalendarEvent[];
  loading: boolean;
  refreshCalendars: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  saveEvent: (event: CalendarEvent, isEditing: boolean) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCalendars = useCallback(async () => {
    const list = await calendarsApi.getCalendars();
    setCalendars(list);
    setSelectedOwnerId((prev) => prev ?? user?.id ?? list[0]?.ownerId ?? null);
  }, [user?.id]);

  const refreshEvents = useCallback(async () => {
    if (!selectedOwnerId) return;
    setLoading(true);
    try {
      const list = await calendarsApi.getEvents(selectedOwnerId);
      setEvents(list);
    } finally {
      setLoading(false);
    }
  }, [selectedOwnerId]);

  // 마운트 시(및 selectedOwnerId 변경 시) 1회 데이터 로드 — 표준 fetch-on-mount 패턴.
  useEffect(() => {
    refreshCalendars();
  }, [refreshCalendars]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  function selectCalendar(ownerId: string) {
    setSelectedOwnerId(ownerId);
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
  const saveEvent = useCallback(
    async (event: CalendarEvent, isEditing: boolean) => {
      if (!selectedOwnerId) return;
      setEvents((prev) => [...prev.filter((e) => e.id !== event.id), event]);
      if (isEditing) {
        await calendarsApi.updateEvent(selectedOwnerId, event);
      } else {
        await calendarsApi.createEvent(selectedOwnerId, event);
      }
    },
    [selectedOwnerId]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!selectedOwnerId) return;
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await calendarsApi.deleteEvent(selectedOwnerId, id);
    },
    [selectedOwnerId]
  );

  const selectedCalendar =
    calendars.find((c) => c.ownerId === selectedOwnerId) ?? null;

  const value: CalendarContextValue = {
    calendars,
    selectedOwnerId,
    selectedCalendar,
    isOwnSelected: selectedCalendar?.isOwn ?? false,
    canEdit: selectedCalendar?.permission === "edit",
    selectCalendar,
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
