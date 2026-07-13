import { cookies, headers } from "next/headers";
import crypto from "node:crypto";
import {
  SESSION_COOKIE_NAME,
  createSession as dbCreateSession,
  createUser,
  deleteSession as dbDeleteSession,
  getSession as dbGetSession,
  getUserByUsername,
} from "@/lib/server/db";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30일

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

export async function createSessionToken(
  userId: string
): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  dbCreateSession(token, userId, expiresAt.toISOString());
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function createSessionCookie(userId: string): Promise<void> {
  const { token, expiresAt } = await createSessionToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

// 모바일 클라이언트는 쿠키 대신 `Authorization: Bearer <token>` 헤더로 인증한다.
async function getBearerToken(): Promise<string | null> {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) return null;
  return authHeader.replace(/^Bearer\s+/i, "").trim();
}

// 쿠키(웹)와 Authorization 헤더(모바일) 중 현재 요청에 실려온 세션 토큰을 반환한다.
export async function getCurrentSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? (await getBearerToken());
}

export async function getCurrentUser(): Promise<
  { id: string; username: string } | null
> {
  const token = await getCurrentSessionToken();
  if (!token) return null;
  const session = dbGetSession(token);
  if (!session) return null;
  return { id: session.userId, username: session.username };
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) dbDeleteSession(token);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// 모바일 로그아웃: 쿠키를 건드리지 않고 Bearer 토큰으로 넘어온 세션만 삭제한다.
export async function deleteSessionToken(token: string): Promise<void> {
  dbDeleteSession(token);
}

export type RegisterOutcome =
  | { ok: true; user: { id: string; username: string } }
  | { ok: false; error: "missing_fields" | "username_taken" };

export function registerUser(username: string, password: string): RegisterOutcome {
  const trimmed = username.trim();
  if (!trimmed || !password) {
    return { ok: false, error: "missing_fields" };
  }
  if (getUserByUsername(trimmed)) {
    return { ok: false, error: "username_taken" };
  }

  const id = crypto.randomUUID();
  createUser(id, trimmed, hashPassword(password));
  return { ok: true, user: { id, username: trimmed } };
}

export type LoginOutcome =
  | { ok: true; user: { id: string; username: string } }
  | { ok: false };

// "유저 없음"과 "비밀번호 틀림"을 구분하지 않고 동일하게 실패로 반환해 아이디 존재 여부가 유출되지 않게 한다.
export function verifyCredentials(username: string, password: string): LoginOutcome {
  const user = getUserByUsername(username.trim());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false };
  }
  return { ok: true, user: { id: user.id, username: user.username } };
}
