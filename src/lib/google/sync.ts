import "server-only";

import { after } from "next/server";
import {
  buildGoogleEvents,
  GoogleCalendarApi,
  planChanges,
  runLimited,
  type SyncSource,
} from "@/lib/google/calendar";
import {
  isGoogleCalendarConfigured,
  loadConnection,
  ReconnectNeededError,
  refreshAccessToken,
  updateConnection,
} from "@/lib/google/tokens";
import type { EventType } from "@/lib/schedule/calendar";
import { FALLBACK_TIMEZONE, utcToLocal } from "@/lib/schedule/time";
import { createClient, signedInClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const RECONNECT = "reconnect";

export type SyncResult = { status: "synced"; changes: number } | { status: "not-connected" } | { status: "error"; message: string };

/** Reads the schedule as the student, so row-level security still decides what's theirs. */
async function loadSource(supabase: Supabase): Promise<SyncSource> {
  const [profile, subjects, terms, meetings, events] = await Promise.all([
    supabase.from("profiles").select("timezone").maybeSingle(),
    supabase.from("subjects").select("id, name, color, term_id, archived_at"),
    supabase.from("terms").select("id, start_date, end_date"),
    supabase.from("class_meetings").select("*"),
    supabase.from("events").select("*"),
  ]);
  const failed = [profile, subjects, terms, meetings, events].find((result) => result.error);
  if (failed?.error) throw new Error(`Couldn't load the schedule: ${failed.error.message}`);

  const timezone = profile.data?.timezone ?? FALLBACK_TIMEZONE;
  return {
    timezone,
    subjects: (subjects.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color ?? "",
      termId: row.term_id,
      archivedAt: row.archived_at,
    })),
    terms: (terms.data ?? []).map((row) => ({ id: row.id, startDate: row.start_date, endDate: row.end_date })),
    meetings: (meetings.data ?? []).map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
      location: row.location ?? "",
      createdOn: utcToLocal(row.created_at, timezone).slice(0, 10),
    })),
    events: (events.data ?? []).map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      title: row.title,
      type: row.type as EventType,
      startsAt: utcToLocal(row.starts_at, row.all_day ? "UTC" : timezone),
      endsAt: row.ends_at ? utcToLocal(row.ends_at, timezone) : null,
      allDay: row.all_day,
      completedAt: row.completed_at,
    })),
  };
}

/** Brings the student's Google calendar in line with the app. Safe to run twice at once. */
export async function syncCalendar(supabase: Supabase, userId: string): Promise<SyncResult> {
  if (!isGoogleCalendarConfigured) return { status: "not-connected" };

  let connection;
  try {
    connection = await loadConnection(userId);
  } catch (error) {
    // Most likely the encryption key changed, which makes every stored token unreadable.
    console.error(error);
    await updateConnection(userId, { sync_error: RECONNECT }).catch(() => {});
    return { status: "error", message: RECONNECT };
  }
  if (!connection) return { status: "not-connected" };

  try {
    const api = new GoogleCalendarApi(await refreshAccessToken(connection.refreshToken));
    const source = await loadSource(supabase);

    let calendarId = connection.calendarId;
    if (!calendarId || !(await api.calendarExists(calendarId))) {
      calendarId = await api.createCalendar(source.timezone);
      await updateConnection(userId, { calendar_id: calendarId });
    }

    const changes = planChanges(await api.listAppEvents(calendarId), buildGoogleEvents(source));
    const id = calendarId;
    const failures = [
      ...(await runLimited(changes.create, 4, (body) => api.insertEvent(id, body))),
      ...(await runLimited(changes.update, 4, (body) => api.putEvent(id, body))),
      ...(await runLimited(changes.remove, 4, (eventId) => api.deleteEvent(id, eventId))),
    ];

    if (failures.length > 0) {
      console.error("Some Google Calendar changes failed", failures);
      const total = changes.create.length + changes.update.length + changes.remove.length;
      const message = `${failures.length} of ${total} changes didn't reach Google Calendar. Try syncing again.`;
      await updateConnection(userId, { last_synced_at: new Date().toISOString(), sync_error: message });
      return { status: "error", message };
    }

    await updateConnection(userId, { last_synced_at: new Date().toISOString(), sync_error: null });
    return { status: "synced", changes: changes.create.length + changes.update.length + changes.remove.length };
  } catch (error) {
    const message =
      error instanceof ReconnectNeededError ? RECONNECT : "Couldn't reach Google Calendar. Try syncing again.";
    if (!(error instanceof ReconnectNeededError)) console.error(error);
    await updateConnection(userId, { sync_error: message }).catch(() => {});
    return { status: "error", message };
  }
}

/**
 * Call after any save that changes the schedule. The sync runs once the response has gone, so
 * saving never waits for Google. Students who haven't connected cost one small query.
 */
export function syncCalendarLater() {
  if (!isGoogleCalendarConfigured) return;
  after(async () => {
    try {
      const session = await signedInClient();
      if (session) await syncCalendar(session.supabase, session.userId);
    } catch (error) {
      console.error("Google Calendar sync failed", error);
    }
  });
}
