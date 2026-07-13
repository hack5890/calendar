import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { createSessionToken, verifyCredentials } from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return jsonError("missing_fields", "아이디와 비밀번호를 입력해 주세요.", 400);
  }

  const outcome = verifyCredentials(username, password);
  if (!outcome.ok) {
    return jsonError(
      "invalid_credentials",
      "아이디 또는 비밀번호가 올바르지 않습니다.",
      401
    );
  }

  const { token, expiresAt } = await createSessionToken(outcome.user.id);
  return jsonData({ token, expiresAt, user: outcome.user });
}
