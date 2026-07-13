import { EVENT_COLORS } from "@/lib/eventColors";
import type { CalendarEvent, RecurrenceFrequency } from "@/lib/types";

const REPEAT_VALUES: RecurrenceFrequency[] = ["daily", "weekly", "monthly", "yearly"];

export type ValidateEventResult =
  | { ok: true; event: CalendarEvent }
  | { ok: false; message: string };

// 외부에서 직접 호출 가능한 공개 API 엔드포인트이므로, Server Action과 달리 런타임에서 형태를 검증한다.
export function validateEventBody(body: unknown): ValidateEventResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.id !== "string" || !b.id) {
    return { ok: false, message: "id는 비어 있지 않은 문자열이어야 합니다." };
  }
  if (typeof b.title !== "string" || !b.title) {
    return { ok: false, message: "title은 비어 있지 않은 문자열이어야 합니다." };
  }
  if (typeof b.date !== "string" || !b.date) {
    return { ok: false, message: "date는 비어 있지 않은 문자열이어야 합니다." };
  }
  if (b.time !== undefined && typeof b.time !== "string") {
    return { ok: false, message: "time은 문자열이어야 합니다." };
  }
  if (b.description !== undefined && typeof b.description !== "string") {
    return { ok: false, message: "description은 문자열이어야 합니다." };
  }
  if (b.repeat !== undefined && !REPEAT_VALUES.includes(b.repeat as RecurrenceFrequency)) {
    return { ok: false, message: "repeat 값이 올바르지 않습니다." };
  }
  if (b.repeatInterval !== undefined && typeof b.repeatInterval !== "number") {
    return { ok: false, message: "repeatInterval은 숫자여야 합니다." };
  }
  if (b.repeatUntil !== undefined && typeof b.repeatUntil !== "string") {
    return { ok: false, message: "repeatUntil은 문자열이어야 합니다." };
  }
  if (b.color !== undefined && !(EVENT_COLORS as readonly string[]).includes(b.color as string)) {
    return { ok: false, message: "color 값이 올바르지 않습니다." };
  }

  return {
    ok: true,
    event: {
      id: b.id,
      title: b.title,
      date: b.date,
      time: b.time as string | undefined,
      description: b.description as string | undefined,
      repeat: b.repeat as RecurrenceFrequency | undefined,
      repeatInterval: b.repeatInterval as number | undefined,
      repeatUntil: b.repeatUntil as string | undefined,
      color: b.color as CalendarEvent["color"],
    },
  };
}
