import type { getTranslations } from "@/lib/i18n";
import type { CalendarEvent, CalendarSummary } from "@/lib/types";

// 캘린더 요약 정보로부터 화면에 표시할 라벨을 만든다("내 캘린더" / "{username}님의 캘린더").
// mobile의 여러 화면(MonthHeader, CalendarPickerList, DayEventList, EventForm)에서 공유한다.
export function calendarLabel(
  t: ReturnType<typeof getTranslations>,
  calendar: Pick<CalendarSummary, "isOwn" | "ownerUsername"> | null | undefined
): string {
  if (!calendar) return "";
  return calendar.isOwn ? t.myCalendar : t.calendarOf(calendar.ownerUsername);
}

// 연/월/일을 "YYYY-MM-DD" 형식의 문자열 키로 변환한다. (month는 0부터 시작하는 인덱스)
// src/components/Calendar.tsx의 toDateKey와 동일한 알고리즘 — 반드시 그대로 유지할 것.
export function toDateKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export interface MonthGridCell {
  day: number;
  dateKey: string;
  inMonth: boolean;
}

// 달력 한 달치 그리드(6주 x 7일 = 42칸)를 생성한다.
// src/components/Calendar.tsx의 buildMonthGrid와 동일한 알고리즘 — 반드시 그대로 유지할 것.
export function buildMonthGrid(year: number, month: number): MonthGridCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: MonthGridCell[] = [];

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
// src/components/Calendar.tsx의 eventOccursOnDate와 동일한 알고리즘 — 반드시 그대로 유지할 것.
// (월말 보정/윤년 폴백 없음, 로컬 타임존 기준, repeatUntil은 포함 상한)
export function eventOccursOnDate(event: CalendarEvent, dateKey: string): boolean {
  if (dateKey < event.date) return false;
  if (event.repeatUntil && dateKey > event.repeatUntil) return false;
  if (dateKey === event.date) return true;
  if (!event.repeat) return false;

  const interval =
    event.repeatInterval && event.repeatInterval > 0 ? event.repeatInterval : 1;
  const [sy, sm, sd] = event.date.split("-").map(Number);
  const [ty, tm, td] = dateKey.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const target = new Date(ty, tm - 1, td);

  switch (event.repeat) {
    case "daily": {
      const diffDays = Math.round((target.getTime() - start.getTime()) / 86_400_000);
      return diffDays % interval === 0;
    }
    case "weekly": {
      const diffDays = Math.round((target.getTime() - start.getTime()) / 86_400_000);
      if (diffDays % 7 !== 0) return false;
      return (diffDays / 7) % interval === 0;
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
