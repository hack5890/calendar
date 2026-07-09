import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { CalendarEvent } from "@/lib/types";

export const SESSION_COOKIE_NAME = "session_token";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "calendar.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    time TEXT,
    description TEXT,
    repeat TEXT,
    repeat_interval INTEGER,
    repeat_until TEXT,
    color TEXT,
    owner_id TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calendar_shares (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id),
    shared_with_id TEXT NOT NULL REFERENCES users(id),
    permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
    created_at TEXT NOT NULL,
    UNIQUE(owner_id, shared_with_id)
  );
  CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON calendar_shares(shared_with_id);
`);

// 기존에 생성된 DB 파일에는 아래 컬럼들이 없을 수 있으므로 마이그레이션한다.
const existingColumns = new Set(
  (db.prepare("PRAGMA table_info(events)").all() as { name: string }[]).map(
    (c) => c.name
  )
);
if (!existingColumns.has("repeat")) {
  db.exec("ALTER TABLE events ADD COLUMN repeat TEXT");
}
if (!existingColumns.has("repeat_interval")) {
  db.exec("ALTER TABLE events ADD COLUMN repeat_interval INTEGER");
}
if (!existingColumns.has("repeat_until")) {
  db.exec("ALTER TABLE events ADD COLUMN repeat_until TEXT");
}
if (!existingColumns.has("color")) {
  db.exec("ALTER TABLE events ADD COLUMN color TEXT");
}
if (!existingColumns.has("owner_id")) {
  db.exec("ALTER TABLE events ADD COLUMN owner_id TEXT");
}

interface EventRow {
  id: string;
  date: string;
  title: string;
  time: string | null;
  description: string | null;
  repeat: string | null;
  repeat_interval: number | null;
  repeat_until: string | null;
  color: string | null;
  owner_id: string | null;
}

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    time: row.time ?? undefined,
    description: row.description ?? undefined,
    repeat: (row.repeat as CalendarEvent["repeat"]) ?? undefined,
    repeatInterval: row.repeat_interval ?? undefined,
    repeatUntil: row.repeat_until ?? undefined,
    color: (row.color as CalendarEvent["color"]) ?? undefined,
  };
}

export function getAllEvents(ownerId: string): CalendarEvent[] {
  const rows = db
    .prepare(
      "SELECT id, date, title, time, description, repeat, repeat_interval, repeat_until, color, owner_id FROM events WHERE owner_id = ?"
    )
    .all(ownerId) as EventRow[];
  return rows.map(rowToEvent);
}

export function saveEvent(event: CalendarEvent, ownerId: string): void {
  db.prepare(
    `INSERT INTO events (id, date, title, time, description, repeat, repeat_interval, repeat_until, color, owner_id)
     VALUES (@id, @date, @title, @time, @description, @repeat, @repeatInterval, @repeatUntil, @color, @ownerId)
     ON CONFLICT(id) DO UPDATE SET
       date = excluded.date,
       title = excluded.title,
       time = excluded.time,
       description = excluded.description,
       repeat = excluded.repeat,
       repeat_interval = excluded.repeat_interval,
       repeat_until = excluded.repeat_until,
       color = excluded.color
     WHERE events.owner_id = @ownerId`
  ).run({
    id: event.id,
    date: event.date,
    title: event.title,
    time: event.time ?? null,
    description: event.description ?? null,
    repeat: event.repeat ?? null,
    repeatInterval: event.repeatInterval ?? null,
    repeatUntil: event.repeatUntil ?? null,
    color: event.color ?? null,
    ownerId,
  });
}

export function deleteEvent(id: string, ownerId: string): void {
  db.prepare("DELETE FROM events WHERE id = ? AND owner_id = ?").run(
    id,
    ownerId
  );
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

function rowToUser(row: {
  id: string;
  username: string;
  password_hash: string;
}): User {
  return { id: row.id, username: row.username, passwordHash: row.password_hash };
}

export function createUser(id: string, username: string, passwordHash: string): void {
  const isFirstUser =
    (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n === 0;

  db.prepare(
    "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, username, passwordHash, new Date().toISOString());

  // 최초 가입자에게는 소유자 없이 남아 있던 기존 일정(마이그레이션 이전 데이터)을 배정한다.
  if (isFirstUser) {
    db.prepare("UPDATE events SET owner_id = ? WHERE owner_id IS NULL").run(id);
  }
}

export function getUserByUsername(username: string): User | undefined {
  const row = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username) as { id: string; username: string; password_hash: string } | undefined;
  return row ? rowToUser(row) : undefined;
}

export function getUserById(id: string): User | undefined {
  const row = db
    .prepare("SELECT id, username, password_hash FROM users WHERE id = ?")
    .get(id) as { id: string; username: string; password_hash: string } | undefined;
  return row ? rowToUser(row) : undefined;
}

export function createSession(token: string, userId: string, expiresAt: string): void {
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(token, userId, expiresAt);
}

export function getSession(
  token: string
): { userId: string; username: string } | undefined {
  const row = db
    .prepare(
      `SELECT s.user_id AS userId, s.expires_at AS expiresAt, u.username AS username
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as
    | { userId: string; expiresAt: string; username: string }
    | undefined;

  if (!row) return undefined;
  if (row.expiresAt < new Date().toISOString()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return undefined;
  }
  return { userId: row.userId, username: row.username };
}

export function deleteSession(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export type SharePermission = "view" | "edit";

export interface ShareGrant {
  id: string;
  sharedWithId: string;
  sharedWithUsername: string;
  permission: SharePermission;
}

export interface SharedCalendar {
  ownerId: string;
  ownerUsername: string;
  permission: SharePermission;
}

export function upsertShare(
  ownerId: string,
  sharedWithId: string,
  permission: SharePermission
): void {
  db.prepare(
    `INSERT INTO calendar_shares (id, owner_id, shared_with_id, permission, created_at)
     VALUES (@id, @ownerId, @sharedWithId, @permission, @createdAt)
     ON CONFLICT(owner_id, shared_with_id) DO UPDATE SET permission = excluded.permission`
  ).run({
    id: crypto.randomUUID(),
    ownerId,
    sharedWithId,
    permission,
    createdAt: new Date().toISOString(),
  });
}

export function deleteShare(ownerId: string, sharedWithId: string): void {
  db.prepare(
    "DELETE FROM calendar_shares WHERE owner_id = ? AND shared_with_id = ?"
  ).run(ownerId, sharedWithId);
}

export function getSharePermission(
  ownerId: string,
  sharedWithId: string
): SharePermission | undefined {
  const row = db
    .prepare(
      "SELECT permission FROM calendar_shares WHERE owner_id = ? AND shared_with_id = ?"
    )
    .get(ownerId, sharedWithId) as { permission: SharePermission } | undefined;
  return row?.permission;
}

export function listSharesByOwner(ownerId: string): ShareGrant[] {
  return db
    .prepare(
      `SELECT cs.id AS id, cs.shared_with_id AS sharedWithId, u.username AS sharedWithUsername, cs.permission AS permission
       FROM calendar_shares cs JOIN users u ON u.id = cs.shared_with_id
       WHERE cs.owner_id = ?
       ORDER BY u.username`
    )
    .all(ownerId) as ShareGrant[];
}

export function listSharedWithUser(userId: string): SharedCalendar[] {
  return db
    .prepare(
      `SELECT cs.owner_id AS ownerId, u.username AS ownerUsername, cs.permission AS permission
       FROM calendar_shares cs JOIN users u ON u.id = cs.owner_id
       WHERE cs.shared_with_id = ?
       ORDER BY u.username`
    )
    .all(userId) as SharedCalendar[];
}
