import { revalidatePath } from "next/cache";
import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { requireCalendarAccess } from "@/lib/server/apiAuth";
import { deleteEvent, saveEvent } from "@/lib/server/db";
import { validateEventBody } from "@/lib/server/validateEvent";

type Params = { params: Promise<{ ownerId: string; eventId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { ownerId, eventId } = await params;
  const auth = await requireCalendarAccess(ownerId, "edit");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const result = validateEventBody(body);
  if (!result.ok) {
    return jsonError("invalid_body", result.message, 400);
  }
  if (result.event.id !== eventId) {
    return jsonError("invalid_body", "본문의 id가 경로의 eventId와 일치하지 않습니다.", 400);
  }

  saveEvent(result.event, ownerId);
  revalidatePath("/");
  return jsonData({ success: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { ownerId, eventId } = await params;
  const auth = await requireCalendarAccess(ownerId, "edit");
  if (!auth.ok) return auth.response;

  deleteEvent(eventId, ownerId);
  revalidatePath("/");
  return jsonData({ success: true });
}
