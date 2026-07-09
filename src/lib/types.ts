import type { EventColor } from "@/lib/eventColors";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD, 반복 일정의 경우 시작일(anchor)로 사용된다
  title: string;
  time?: string; // HH:mm
  description?: string;
  repeat?: RecurrenceFrequency;
  repeatInterval?: number; // 반복 간격 (예: repeat이 weekly이고 이 값이 2면 2주마다). 없으면 1로 취급
  repeatUntil?: string; // YYYY-MM-DD, 반복 종료일(포함). 없으면 무기한 반복
  color?: EventColor; // 일정 구분용 색상 태그. 없으면 기본(반복 여부 기반) 색상을 사용
}
