import { jsonData } from "@/lib/server/apiResponse";
import { requireCalendarAccess } from "@/lib/server/apiAuth";
import { getActivityLog } from "@/lib/server/db";
import type { ActivityLogSummary } from "@/lib/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const { ownerId } = await params;
  const auth = await requireCalendarAccess(ownerId, "view");
  if (!auth.ok) return auth.response;

  const entries: ActivityLogSummary[] = getActivityLog(ownerId).map((entry) => ({
    id: entry.id,
    actorUsername: entry.actorUsername,
    action: entry.action,
    eventTitle: entry.eventTitle,
    createdAt: entry.createdAt,
  }));
  return jsonData(entries);
}
