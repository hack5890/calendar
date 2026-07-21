import type { EventColor } from "@/lib/eventColors";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD, 반복 일정의 경우 시작일(anchor)로 사용된다
  title: string;
  time?: string; // HH:mm
  description?: string;
  repeat?: RecurrenceFrequency;
  repeatInterval?: number; // 반복 간격. 없으면 1로 취급
  repeatUntil?: string; // YYYY-MM-DD, 반복 종료일(포함). 없으면 무기한 반복
  color?: EventColor;
  reminderMinutesBefore?: number; // 알림 시각(이벤트 시작 몇 분 전). time이 없으면 무시된다
}

// 여러 캘린더를 겹쳐볼 때, 각 이벤트가 어느 캘린더(owner) 소속인지 함께 들고 있는 형태.
// src/components/Calendar.tsx의 OwnedEvent와 동일한 개념.
export type OwnedEvent = CalendarEvent & { ownerId: string };

export type SharePermission = "view" | "edit";

export interface CalendarSummary {
  ownerId: string;
  ownerUsername: string;
  isOwn: boolean;
  permission: SharePermission;
}

export interface ShareSummary {
  id: string;
  sharedWithId: string;
  sharedWithUsername: string;
  permission: SharePermission;
}

export type ActivityAction = "created" | "updated" | "deleted";

export interface ActivityLogEntry {
  id: string;
  actorUsername: string;
  action: ActivityAction;
  eventTitle: string;
  createdAt: string;
}

export type AuthErrorCode =
  | "missing_fields"
  | "username_taken"
  | "invalid_credentials";

export type ShareErrorCode = "self_share" | "user_not_found";
