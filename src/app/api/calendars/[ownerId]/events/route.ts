import { revalidatePath } from "next/cache";
import { jsonData, jsonError } from "@/lib/server/apiResponse";
import { requireCalendarAccess } from "@/lib/server/apiAuth";
import { getAllEvents, saveEvent } from "@/lib/server/db";
import { validateEventBody } from "@/lib/server/validateEvent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const { ownerId } = await params;
  const auth = await requireCalendarAccess(ownerId, "view");
  if (!auth.ok) return auth.response;

  return jsonData(getAllEvents(ownerId));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const { ownerId } = await params;
  const auth = await requireCalendarAccess(ownerId, "edit");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const result = validateEventBody(body);
  if (!result.ok) {
    return jsonError("invalid_body", result.message, 400);
  }

  saveEvent(result.event, ownerId);
  revalidatePath("/");
  return jsonData({ success: true }, 201);
}
