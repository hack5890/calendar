import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("unauthenticated", "로그인이 필요합니다.", 401);
  }
  return jsonData(user);
}
