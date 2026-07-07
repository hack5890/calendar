import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { CalendarEvent } from "@/lib/types";

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
    repeat_until TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
`);

// 기존에 생성된 DB 파일에는 repeat/repeat_until 컬럼이 없을 수 있으므로 마이그레이션한다.
const existingColumns = new Set(
  (db.prepare("PRAGMA table_info(events)").all() as { name: string }[]).map(
    (c) => c.name
  )
);
if (!existingColumns.has("repeat")) {
  db.exec("ALTER TABLE events ADD COLUMN repeat TEXT");
}
if (!existingColumns.has("repeat_until")) {
  db.exec("ALTER TABLE events ADD COLUMN repeat_until TEXT");
}

interface EventRow {
  id: string;
  date: string;
  title: string;
  time: string | null;
  description: string | null;
  repeat: string | null;
  repeat_until: string | null;
}

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    time: row.time ?? undefined,
    description: row.description ?? undefined,
    repeat: (row.repeat as CalendarEvent["repeat"]) ?? undefined,
    repeatUntil: row.repeat_until ?? undefined,
  };
}

export function getAllEvents(): CalendarEvent[] {
  const rows = db
    .prepare(
      "SELECT id, date, title, time, description, repeat, repeat_until FROM events"
    )
    .all() as EventRow[];
  return rows.map(rowToEvent);
}

export function saveEvent(event: CalendarEvent): void {
  db.prepare(
    `INSERT INTO events (id, date, title, time, description, repeat, repeat_until)
     VALUES (@id, @date, @title, @time, @description, @repeat, @repeatUntil)
     ON CONFLICT(id) DO UPDATE SET
       date = excluded.date,
       title = excluded.title,
       time = excluded.time,
       description = excluded.description,
       repeat = excluded.repeat,
       repeat_until = excluded.repeat_until`
  ).run({
    id: event.id,
    date: event.date,
    title: event.title,
    time: event.time ?? null,
    description: event.description ?? null,
    repeat: event.repeat ?? null,
    repeatUntil: event.repeatUntil ?? null,
  });
}

export function deleteEvent(id: string): void {
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
}
