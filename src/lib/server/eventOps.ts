import {
  deleteEvent as dbDeleteEvent,
  eventExists,
  getEventTitle,
  logActivity,
  saveEvent as dbSaveEvent,
} from "@/lib/server/db";
import type { CalendarEvent } from "@/lib/types";

// "DB 반영 + 활동 로그 기록"을 한 곳에 묶은 헬퍼. Server Action(actions.ts)과 REST 라우트
// (app/api/calendars/[ownerId]/events/**)가 반드시 이 함수들을 통해서만 이벤트를 쓰도록 해서,
// 둘 중 한쪽에만 로깅을 추가했다가 REST(모바일)로 들어온 변경이 활동 로그에서 누락되는
// 사고가 재발하지 않게 한다 — 새 쓰기 경로를 추가할 때도 이 패턴을 따를 것.
export function createOrUpdateEventWithLog(
  event: CalendarEvent,
  ownerId: string,
  actorId: string
): void {
  const isNew = !eventExists(event.id, ownerId);
  dbSaveEvent(event, ownerId);
  logActivity(ownerId, actorId, isNew ? "created" : "updated", event.title);
}

export function deleteEventWithLog(
  id: string,
  ownerId: string,
  actorId: string
): void {
  const title = getEventTitle(id, ownerId);
  dbDeleteEvent(id, ownerId);
  if (title !== undefined) {
    logActivity(ownerId, actorId, "deleted", title);
  }
}
