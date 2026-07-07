export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD, 반복 일정의 경우 시작일(anchor)로 사용된다
  title: string;
  time?: string; // HH:mm
  description?: string;
  repeat?: RecurrenceFrequency;
  repeatUntil?: string; // YYYY-MM-DD, 반복 종료일(포함). 없으면 무기한 반복
}
