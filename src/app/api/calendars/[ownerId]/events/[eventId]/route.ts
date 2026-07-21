import { revalidatePath } from "next/cache";
import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { requireCalendarAccess } from "@/lib/server/apiAuth";
import { createOrUpdateEventWithLog, deleteEventWithLog } from "@/lib/server/eventOps";
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

  createOrUpdateEventWithLog(result.event, ownerId, auth.user.id);
  revalidatePath("/");
  return jsonData({ success: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { ownerId, eventId } = await params;
  const auth = await requireCalendarAccess(ownerId, "edit");
  if (!auth.ok) return auth.response;

  deleteEventWithLog(eventId, ownerId, auth.user.id);
  revalidatePath("/");
  return jsonData({ success: true });
}
