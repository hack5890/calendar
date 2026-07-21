import { apiFetch } from "@/lib/api/client";
import type { ActivityLogEntry, CalendarEvent, CalendarSummary } from "@/lib/types";

export function getCalendars(): Promise<CalendarSummary[]> {
  return apiFetch<CalendarSummary[]>("/api/calendars");
}

export function getEvents(ownerId: string): Promise<CalendarEvent[]> {
  return apiFetch<CalendarEvent[]>(`/api/calendars/${ownerId}/events`);
}

export function createEvent(
  ownerId: string,
  event: CalendarEvent
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/calendars/${ownerId}/events`, {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export function updateEvent(
  ownerId: string,
  event: CalendarEvent
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/api/calendars/${ownerId}/events/${event.id}`,
    { method: "PUT", body: JSON.stringify(event) }
  );
}

export function deleteEvent(
  ownerId: string,
  eventId: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/api/calendars/${ownerId}/events/${eventId}`,
    { method: "DELETE" }
  );
}

export function getActivityLog(ownerId: string): Promise<ActivityLogEntry[]> {
  return apiFetch<ActivityLogEntry[]>(`/api/calendars/${ownerId}/activity`);
}
