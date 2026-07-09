import { cookies } from "next/headers";
import crypto from "node:crypto";
import {
  SESSION_COOKIE_NAME,
  createSession as dbCreateSession,
  deleteSession as dbDeleteSession,
  getSession as dbGetSession,
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

export async function createSessionCookie(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  dbCreateSession(token, userId, expiresAt.toISOString());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<
  { id: string; username: string } | null
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
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
