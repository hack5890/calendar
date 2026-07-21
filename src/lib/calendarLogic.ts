import type { CalendarEvent } from "@/lib/types";

// 여러 캘린더를 겹쳐볼 때, 각 이벤트가 어느 캘린더(owner) 소속인지 함께 들고 있는 형태.
export type OwnedEvent = CalendarEvent & { ownerId: string };

// 월 전환 슬라이드 애니메이션 지속 시간(ms). Tailwind duration-300과 맞춘다.
export const MONTH_TRANSITION_MS = 300;
// 스와이프로 월 전환을 트리거하는 최소 이동 거리(px).
export const SWIPE_THRESHOLD_PX = 50;

// 연/월/일을 "YYYY-MM-DD" 형식의 문자열 키로 변환한다. (month는 0부터 시작하는 인덱스)
export function toDateKey(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// 달력 한 달치 그리드(6주 x 7일 = 42칸)를 생성한다.
// 해당 월의 1일이 시작되는 요일만큼 이전 달의 날짜로 앞을 채우고,
// 이번 달 날짜를 채운 뒤, 42칸이 될 때까지 다음 달 날짜로 뒤를 채운다.
export function buildMonthGrid(year: number, month: number) {
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

// 특정 날짜(dateKey)가 속한 주(일~토)의 7일치 dateKey 배열을 만든다. 주간 뷰에서 사용한다.
export function buildWeekRange(dateKey: string): string[] {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - base.getDay());
  const result: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(sunday);
    dt.setDate(sunday.getDate() + i);
    result.push(toDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  }
  return result;
}

// dateKey를 기준으로 days만큼(음수면 과거로) 이동한 날짜의 dateKey를 반환한다.
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

// 주간 뷰 헤더에 표시할 날짜 범위 레이블(예: "Jul 13 – 19, 2026")을 만든다.
export function formatWeekRangeLabel(weekDates: string[], locale: string): string {
  const start = weekDates[0];
  const end = weekDates[weekDates.length - 1];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);
  const startLabel = startDate.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  const endLabel = endDate.toLocaleDateString(
    locale,
    sy === ey && sm === em ? { day: "numeric" } : { month: "short", day: "numeric" }
  );
  return `${startLabel} – ${endLabel}, ${ey}`;
}

// 일정이 주어진 날짜(dateKey)에 발생하는지 판단한다.
// 반복이 없으면 시작일과 정확히 같은 날만, 반복이 있으면 시작일 이후(및 종료일 이전) 중
// 반복 주기 * 간격(repeatInterval, 기본 1)에 맞는 날짜에 발생한다고 본다.
export function eventOccursOnDate(event: CalendarEvent, dateKey: string): boolean {
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
export function eventMatchesQuery(event: CalendarEvent, query: string): boolean {
  if (!query) return true;
  return (
    event.title.toLowerCase().includes(query) ||
    (event.description ?? "").toLowerCase().includes(query)
  );
}

// 주어진 이벤트 풀에서 특정 날짜(dateKey)에 발생하는 이벤트만 시간순으로 정렬해 반환한다.
// 월간 뷰의 날짜별 그룹화(eventsByDate)와 주간 뷰의 날짜별 목록에서 공통으로 사용한다.
export function collectEventsForDate(
  pool: OwnedEvent[],
  dateKey: string
): OwnedEvent[] {
  const matches = pool.filter((ev) => eventOccursOnDate(ev, dateKey));
  matches.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  return matches;
}
