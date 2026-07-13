import { revalidatePath } from "next/cache";
import { jsonData } from "@/lib/server/apiResponse";
import { requireUser } from "@/lib/server/apiAuth";
import { deleteShare } from "@/lib/server/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sharedWithId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { sharedWithId } = await params;
  deleteShare(auth.user.id, sharedWithId);
  revalidatePath("/");
  return jsonData({ success: true });
}
