import { createHash } from "node:crypto";
import { Temporal } from "temporal-polyfill";
import {
  eventTitle,
  type ClassMeetingRecord,
  type EventRecord,
  type ScheduleSubject,
  type ScheduleTerm,
} from "@/lib/schedule/calendar";
import { addDays, dayOfWeek, localToUtc } from "@/lib/schedule/time";
import { EVENT_TYPES } from "@/lib/validation/schedule";

// Sync is one way: the app is the source, and Google Calendar shows a copy in a calendar the app
// made for itself. The calendar.app.created permission only reaches that calendar, so the app
// can't read or change anything else in the student's Google account.

const API = "https://www.googleapis.com/calendar/v3";

export const CALENDAR_NAME = "Education App";
// Marks events the app made, so a sync never deletes ones the student added to this calendar.
const APP_MARKER = "education-app";
const FOOTER =
  "Added by Education App. Edit this in the app, because changes made in Google Calendar are replaced on the next sync.";

type GoogleTime = { date: string } | { dateTime: string; timeZone: string };

export interface GoogleEventBody {
  id: string;
  summary: string;
  description: string;
  location?: string;
  start: GoogleTime;
  end: GoogleTime;
  recurrence?: string[];
  extendedProperties: { private: { app: string; hash: string } };
}

export interface SyncMeeting extends ClassMeetingRecord {
  // The local date the class time was added, used when its subject has no term.
  createdOn: string;
}

export interface SyncSource {
  timezone: string;
  meetings: SyncMeeting[];
  events: EventRecord[];
  subjects: ScheduleSubject[];
  terms: ScheduleTerm[];
}

/**
 * Google lets apps choose event IDs made of 0-9 and a-v, which covers a UUID's hex digits. Reusing
 * the app's own IDs means two syncs at once can't make duplicates, and no extra column is needed.
 */
export function googleEventId(kind: "class" | "event", id: string) {
  return `${kind === "class" ? "c" : "e"}${id.replaceAll("-", "").toLowerCase()}`;
}

function withHash(body: Omit<GoogleEventBody, "extendedProperties">): GoogleEventBody {
  const hash = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16);
  return { ...body, extendedProperties: { private: { app: APP_MARKER, hash } } };
}

/** RFC 5545 wants UNTIL in UTC when the start has a time zone, like 20270331T155900Z. */
function untilUtc(date: string, timeZone: string) {
  return localToUtc(`${date}T23:59`, timeZone).replace(/[-:]/g, "").replace(/\.\d+/, "");
}

function classEvent(meeting: SyncMeeting, subject: ScheduleSubject, term: ScheduleTerm | undefined, timeZone: string) {
  // The first day on or after the term starts (or the class was added) that falls on this weekday.
  const anchor = term?.startDate ?? meeting.createdOn;
  const first = addDays(anchor, (meeting.dayOfWeek - dayOfWeek(anchor) + 7) % 7);
  if (term && first > term.endDate) return null;

  const rule = term ? `RRULE:FREQ=WEEKLY;UNTIL=${untilUtc(term.endDate, timeZone)}` : "RRULE:FREQ=WEEKLY";
  return withHash({
    id: googleEventId("class", meeting.id),
    summary: subject.name,
    description: FOOTER,
    ...(meeting.location ? { location: meeting.location } : {}),
    start: { dateTime: `${first}T${meeting.startTime}:00`, timeZone },
    end: { dateTime: `${first}T${meeting.endTime}:00`, timeZone },
    recurrence: [rule],
  });
}

/**
 * Deadlines often have no end time, but Google needs one. They get 15 minutes, cut off at
 * midnight so a deadline at 11:59 PM doesn't spill onto the next day.
 */
function defaultEnd(startsAt: string) {
  const start = Temporal.PlainDateTime.from(startsAt);
  const end = start.add({ minutes: 15 });
  const midnight = Temporal.PlainDate.from(startsAt.slice(0, 10)).add({ days: 1 }).toPlainDateTime();
  const capped = Temporal.PlainDateTime.compare(end, midnight) > 0 ? midnight : end;
  return capped.toString({ smallestUnit: "minute" });
}

function singleEvent(event: EventRecord, subject: ScheduleSubject | undefined, timeZone: string) {
  const type = EVENT_TYPES.find((item) => item.value === event.type)?.label ?? "Event";
  const date = event.startsAt.slice(0, 10);
  const timed = (local: string) => ({ dateTime: `${local}:00`, timeZone });

  return withHash({
    id: googleEventId("event", event.id),
    summary: eventTitle(event),
    description: `${subject ? `${type} · ${subject.name}` : type}\n\n${FOOTER}`,
    start: event.allDay ? { date } : timed(event.startsAt),
    // Google's end dates are exclusive, so an all-day event ends the next day.
    end: event.allDay ? { date: addDays(date, 1) } : timed(event.endsAt ?? defaultEnd(event.startsAt)),
  });
}

/** What the app's Google calendar should hold. Like the app's calendar, archived subjects are left out. */
export function buildGoogleEvents({ timezone, meetings, events, subjects, terms }: SyncSource) {
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const termById = new Map(terms.map((term) => [term.id, term]));
  const bodies: GoogleEventBody[] = [];

  for (const meeting of meetings) {
    const subject = subjectById.get(meeting.subjectId);
    if (!subject || subject.archivedAt) continue;
    const term = subject.termId ? termById.get(subject.termId) : undefined;
    const body = classEvent(meeting, subject, term, timezone);
    if (body) bodies.push(body);
  }

  for (const event of events) {
    const subject = event.subjectId ? subjectById.get(event.subjectId) : undefined;
    if (subject?.archivedAt) continue;
    bodies.push(singleEvent(event, subject, timezone));
  }

  return bodies;
}

export interface ExistingEvent {
  id: string;
  hash?: string;
}

/** Only what changed is sent, so a sync after one edit is one list call and one write. */
export function planChanges(existing: ExistingEvent[], desired: GoogleEventBody[]) {
  const existingById = new Map(existing.map((event) => [event.id, event]));
  const desiredIds = new Set(desired.map((body) => body.id));

  return {
    create: desired.filter((body) => !existingById.has(body.id)),
    update: desired.filter((body) => {
      const current = existingById.get(body.id);
      return current && current.hash !== body.extendedProperties.private.hash;
    }),
    remove: existing.filter((event) => !desiredIds.has(event.id)).map((event) => event.id),
  };
}

export class GoogleApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Fetch = typeof fetch;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Calls the Calendar API as the student. Retries briefly when Google says to slow down. */
export class GoogleCalendarApi {
  constructor(
    private readonly accessToken: string,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
    const response = await this.fetchImpl(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });

    if (response.ok) return (response.status === 204 ? undefined : await response.json()) as T;

    const text = await response.text();
    const rateLimited = response.status === 429 || (response.status === 403 && /rateLimitExceeded/i.test(text));
    if (rateLimited && attempt < 3) {
      await wait(500 * 2 ** attempt);
      return this.request(path, init, attempt + 1);
    }
    let message = `Google Calendar replied ${response.status}.`;
    try {
      message = JSON.parse(text).error?.message ?? message;
    } catch {}
    throw new GoogleApiError(response.status, message);
  }

  /** Null when the calendar was deleted, or belongs to a different Google account. */
  async calendarExists(calendarId: string) {
    try {
      await this.request(`/calendars/${encodeURIComponent(calendarId)}`);
      return true;
    } catch (error) {
      if (error instanceof GoogleApiError && [403, 404].includes(error.status)) return false;
      throw error;
    }
  }

  async createCalendar(timeZone: string) {
    const calendar = await this.request<{ id: string }>("/calendars", {
      method: "POST",
      body: JSON.stringify({
        summary: CALENDAR_NAME,
        description: "Classes, exams and deadlines from Education App.",
        timeZone,
      }),
    });
    return calendar.id;
  }

  async deleteCalendar(calendarId: string) {
    try {
      await this.request(`/calendars/${encodeURIComponent(calendarId)}`, { method: "DELETE" });
    } catch (error) {
      if (!(error instanceof GoogleApiError && [404, 410].includes(error.status))) throw error;
    }
  }

  /** Every event the app added to the calendar, with the hash of what it last sent. */
  async listAppEvents(calendarId: string) {
    const events: ExistingEvent[] = [];
    let pageToken: string | undefined;
    do {
      const query = new URLSearchParams({
        privateExtendedProperty: `app=${APP_MARKER}`,
        maxResults: "2500",
        fields: "items(id,extendedProperties/private),nextPageToken",
      });
      if (pageToken) query.set("pageToken", pageToken);
      const page = await this.request<{
        items?: { id: string; extendedProperties?: { private?: { hash?: string } } }[];
        nextPageToken?: string;
      }>(`/calendars/${encodeURIComponent(calendarId)}/events?${query}`);
      for (const item of page.items ?? []) events.push({ id: item.id, hash: item.extendedProperties?.private?.hash });
      pageToken = page.nextPageToken;
    } while (pageToken);
    return events;
  }

  async putEvent(calendarId: string, body: GoogleEventBody) {
    // Restores the event if the student deleted it in Google, which only hides it there.
    await this.request(`/calendars/${encodeURIComponent(calendarId)}/events/${body.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...body, status: "confirmed" }),
    });
  }

  async insertEvent(calendarId: string, body: GoogleEventBody) {
    try {
      await this.request(`/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch (error) {
      // The ID is taken, either by another sync running at the same time or by a deleted event.
      if (error instanceof GoogleApiError && error.status === 409) return this.putEvent(calendarId, body);
      throw error;
    }
  }

  async deleteEvent(calendarId: string, eventId: string) {
    try {
      await this.request(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, { method: "DELETE" });
    } catch (error) {
      if (!(error instanceof GoogleApiError && [404, 410].includes(error.status))) throw error;
    }
  }
}

/** Runs tasks a few at a time, so a first sync doesn't hit Google's per-user rate limit. */
export async function runLimited<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  const failures: unknown[] = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      try {
        await task(item);
      } catch (error) {
        failures.push(error);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return failures;
}
