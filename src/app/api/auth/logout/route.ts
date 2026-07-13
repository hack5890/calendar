import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { deleteSessionToken, getCurrentSessionToken } from "@/lib/server/auth";

export async function POST() {
  const token = await getCurrentSessionToken();
  if (!token) {
    return jsonError("unauthenticated", "로그인이 필요합니다.", 401);
  }
  await deleteSessionToken(token);
  return jsonData({ success: true });
}
