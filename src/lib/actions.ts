"use server";

import { revalidatePath } from "next/cache";
import {
  deleteEvent as dbDeleteEvent,
  getAllEvents as dbGetAllEvents,
  saveEvent as dbSaveEvent,
} from "@/lib/server/db";
import type { CalendarEvent } from "@/lib/types";

export async function getAllEvents(): Promise<CalendarEvent[]> {
  return dbGetAllEvents();
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  dbSaveEvent(event);
  revalidatePath("/");
}

export async function deleteEvent(id: string): Promise<void> {
  dbDeleteEvent(id);
  revalidatePath("/");
}
