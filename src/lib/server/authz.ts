import { getSharePermission, type SharePermission } from "@/lib/server/db";

export type CalendarAccessResult =
  | { ok: true; permission: SharePermission }
  | { ok: false };

// 본인 소유 캘린더는 항상 edit 권한을 가진다. 그렇지 않으면 calendar_shares에 등록된 권한을 따른다.
// 로그인 여부(401)와 권한 부족(403)의 구분은 호출부의 책임이므로 이 함수는 resolved userId만 받는다.
export function checkCalendarAccess(
  userId: string,
  ownerId: string,
  required: SharePermission
): CalendarAccessResult {
  if (userId === ownerId) return { ok: true, permission: "edit" };

  const permission = getSharePermission(ownerId, userId);
  if (!permission || (required === "edit" && permission !== "edit")) {
    return { ok: false };
  }
  return { ok: true, permission };
}
