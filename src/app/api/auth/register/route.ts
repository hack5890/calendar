import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { createSessionToken, registerUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const outcome = registerUser(username, password);
  if (!outcome.ok) {
    const status = outcome.error === "username_taken" ? 409 : 400;
    return jsonError(outcome.error, "회원가입에 실패했습니다.", status);
  }

  const { token, expiresAt } = await createSessionToken(outcome.user.id);
  return jsonData({ token, expiresAt, user: outcome.user }, 201);
}
