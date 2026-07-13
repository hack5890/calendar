import { apiFetch } from "@/lib/api/client";
import type { SharePermission, ShareSummary } from "@/lib/types";

export function getShares(): Promise<ShareSummary[]> {
  return apiFetch<ShareSummary[]>("/api/shares");
}

export function createShare(
  username: string,
  permission: SharePermission
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/shares", {
    method: "POST",
    body: JSON.stringify({ username, permission }),
  });
}

export function deleteShare(sharedWithId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/shares/${sharedWithId}`, {
    method: "DELETE",
  });
}
