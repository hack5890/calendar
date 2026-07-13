import { jsonError } from "@/lib/server/apiResponse";
import { getCurrentUser } from "@/lib/server/auth";
import { checkCalendarAccess } from "@/lib/server/authz";
import type { SharePermission } from "@/lib/server/db";

type AuthGuardResult =
  | { ok: true; user: { id: string; username: string } }
  | { ok: false; response: Response };

export async function requireUser(): Promise<AuthGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError("unauthenticated", "로그인이 필요합니다.", 401),
    };
  }
  return { ok: true, user };
}

// API 라우트 버전의 authorizeCalendar: redirect() 대신 401/403 JSON 응답을 돌려준다.
export async function requireCalendarAccess(
  ownerId: string,
  required: SharePermission
): Promise<AuthGuardResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const access = checkCalendarAccess(auth.user.id, ownerId, required);
  if (!access.ok) {
    return {
      ok: false,
      response: jsonError(
        "forbidden",
        "이 캘린더에 대한 권한이 없습니다.",
        403
      ),
    };
  }
  return auth;
}
