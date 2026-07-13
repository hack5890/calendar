import { revalidatePath } from "next/cache";
import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { requireUser } from "@/lib/server/apiAuth";
import {
  getUserByUsername,
  listSharesByOwner,
  upsertShare,
  type SharePermission,
} from "@/lib/server/db";
import type { ShareSummary } from "@/lib/actions";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const shares: ShareSummary[] = listSharesByOwner(auth.user.id).map((s) => ({
    id: s.id,
    sharedWithId: s.sharedWithId,
    sharedWithUsername: s.sharedWithUsername,
    permission: s.permission,
  }));
  return jsonData(shares);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const permissionInput = body?.permission;

  const trimmed = username.trim();
  if (!trimmed) {
    return jsonError("missing_fields", "공유할 사용자의 아이디를 입력해 주세요.", 400);
  }
  if (permissionInput !== "view" && permissionInput !== "edit") {
    return jsonError("invalid_body", "permission은 view 또는 edit이어야 합니다.", 400);
  }
  const permission: SharePermission = permissionInput;
  if (trimmed === auth.user.username) {
    return jsonError("self_share", "자기 자신과는 캘린더를 공유할 수 없습니다.", 400);
  }
  const target = getUserByUsername(trimmed);
  if (!target) {
    return jsonError("user_not_found", "해당 아이디의 사용자를 찾을 수 없습니다.", 404);
  }

  upsertShare(auth.user.id, target.id, permission);
  revalidatePath("/");
  return jsonData({ success: true }, 201);
}
