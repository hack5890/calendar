import { jsonData } from "@/lib/server/apiResponse";
import { requireUser } from "@/lib/server/apiAuth";
import { listSharedWithUser } from "@/lib/server/db";
import type { CalendarSummary } from "@/lib/actions";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const shared = listSharedWithUser(auth.user.id);
  const calendars: CalendarSummary[] = [
    {
      ownerId: auth.user.id,
      ownerUsername: auth.user.username,
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
  return jsonData(calendars);
}
