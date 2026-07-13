"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  deleteEvent as dbDeleteEvent,
  getAllEvents as dbGetAllEvents,
  saveEvent as dbSaveEvent,
  upsertShare,
  deleteShare,
  getUserByUsername,
  listSharesByOwner,
  listSharedWithUser,
  type SharePermission,
} from "@/lib/server/db";

export type { SharePermission } from "@/lib/server/db";
import {
  clearSessionCookie,
  createSessionCookie,
  getCurrentUser,
  registerUser,
  verifyCredentials,
} from "@/lib/server/auth";
import { checkCalendarAccess } from "@/lib/server/authz";
import type { CalendarEvent } from "@/lib/types";

export type AuthErrorCode =
  | "missing_fields"
  | "username_taken"
  | "invalid_credentials";

export type ShareErrorCode = "self_share" | "user_not_found";

export interface AuthResult {
  error?: AuthErrorCode;
}

export interface ShareResult {
  error?: ShareErrorCode;
}

export interface CalendarSummary {
  ownerId: string;
  ownerUsername: string;
  isOwn: boolean;
  permission: SharePermission;
}

export interface ShareSummary {
  id: string;
  sharedWithId: string;
  sharedWithUsername: string;
  permission: SharePermission;
}

export async function register(
  username: string,
  password: string
): Promise<AuthResult> {
  const outcome = registerUser(username, password);
  if (!outcome.ok) {
    return { error: outcome.error };
  }
  await createSessionCookie(outcome.user.id);
  redirect("/");
}

export async function login(
  username: string,
  password: string
): Promise<AuthResult> {
  const outcome = verifyCredentials(username, password);
  if (!outcome.ok) {
    return { error: "invalid_credentials" };
  }
  await createSessionCookie(outcome.user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

// 현재 로그인한 사용자가 해당 캘린더(ownerId)에 필요한 권한을 갖고 있는지 확인한다.
// 본인 소유 캘린더는 항상 edit 권한을 가진다.
async function authorizeCalendar(
  ownerId: string,
  required: SharePermission
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const access = checkCalendarAccess(user.id, ownerId, required);
  if (!access.ok) {
    throw new Error("이 캘린더에 대한 권한이 없습니다.");
  }
  return user.id;
}

export async function getAllEvents(ownerId: string): Promise<CalendarEvent[]> {
  await authorizeCalendar(ownerId, "view");
  return dbGetAllEvents(ownerId);
}

export async function saveEvent(
  event: CalendarEvent,
  ownerId: string
): Promise<void> {
  await authorizeCalendar(ownerId, "edit");
  dbSaveEvent(event, ownerId);
  revalidatePath("/");
}

export async function deleteEvent(id: string, ownerId: string): Promise<void> {
  await authorizeCalendar(ownerId, "edit");
  dbDeleteEvent(id, ownerId);
  revalidatePath("/");
}

export async function getMyCalendars(): Promise<CalendarSummary[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shared = listSharedWithUser(user.id);
  return [
    {
      ownerId: user.id,
      ownerUsername: user.username,
      isOwn: true,
      permission: "edit",
    },
    ...shared.map((s) => ({
      ownerId: s.ownerId,
      ownerUsername: s.ownerUsername,
      isOwn: false,
      permission: s.permission,
    })),
  ];
}

export async function getMyShares(): Promise<ShareSummary[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return listSharesByOwner(user.id).map((s) => ({
    id: s.id,
    sharedWithId: s.sharedWithId,
    sharedWithUsername: s.sharedWithUsername,
    permission: s.permission,
  }));
}

export async function shareCalendar(
  username: string,
  permission: SharePermission
): Promise<ShareResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trimmed = username.trim();
  if (trimmed === user.username) {
    return { error: "self_share" };
  }
  const target = getUserByUsername(trimmed);
  if (!target) {
    return { error: "user_not_found" };
  }
  upsertShare(user.id, target.id, permission);
  revalidatePath("/");
  return {};
}

export async function unshareCalendar(sharedWithId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  deleteShare(user.id, sharedWithId);
  revalidatePath("/");
}
