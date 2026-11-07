import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleEvents,
  GoogleCalendarApi,
  googleEventId,
  planChanges,
  runLimited,
  type SyncSource,
} from "@/lib/google/calendar";
import { decryptToken, encryptToken, parseTokenKey } from "@/lib/google/crypto";

const SUBJECT = "3f1c2a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f";
const OTHER_SUBJECT = "11111111-2222-4333-8444-555555555555";
const TERM = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const MEETING = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const EVENT = "99999999-8888-4777-8666-555555555555";

function source(overrides: Partial<SyncSource> = {}): SyncSource {
  return {
    timezone: "Asia/Manila",
    subjects: [
      { id: SUBJECT, name: "Calculus II", color: "#2f6fb0", termId: TERM, archivedAt: null },
      { id: OTHER_SUBJECT, name: "Old Class", color: "#2f6fb0", termId: null, archivedAt: "2026-10-01T00:00:00Z" },
    ],
    terms: [{ id: TERM, startDate: "2026-08-12", endDate: "2026-12-18" }],
    meetings: [
      {
        id: MEETING,
        subjectId: SUBJECT,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "09:30",
        location: "Room 204",
        createdOn: "2026-11-04",
      },
    ],
    events: [],
    ...overrides,
  };
}

describe("token encryption", () => {
  const key = randomBytes(32);

  it("round-trips a token for the same student", () => {
    const sealed = encryptToken("1//refresh-token", key, "user-a");
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(sealed).not.toContain("refresh-token");
    expect(decryptToken(sealed, key, "user-a")).toBe("1//refresh-token");
  });

  it("refuses a token moved to another student, or read with another key", () => {
    const sealed = encryptToken("1//refresh-token", key, "user-a");
    expect(() => decryptToken(sealed, key, "user-b")).toThrow();
    expect(() => decryptToken(sealed, randomBytes(32), "user-a")).toThrow();
  });

  it("only accepts a 32-byte key", () => {
    expect(parseTokenKey(randomBytes(32).toString("base64"))?.length).toBe(32);
    expect(parseTokenKey(randomBytes(16).toString("base64"))).toBeNull();
    expect(parseTokenKey(undefined)).toBeNull();
  });
});

describe("buildGoogleEvents", () => {
  it("uses IDs Google accepts", () => {
    const id = googleEventId("class", MEETING);
    expect(id).toMatch(/^[a-v0-9]{5,1024}$/);
    expect(googleEventId("event", MEETING)).not.toBe(id);
  });

  it("repeats a class weekly from the term's first matching day until the term ends", () => {
    const [body] = buildGoogleEvents(source());
    // August 12, 2026 is a Wednesday, so the first Monday is August 17.
    expect(body.start).toEqual({ dateTime: "2026-08-17T08:00:00", timeZone: "Asia/Manila" });
    expect(body.end).toEqual({ dateTime: "2026-08-17T09:30:00", timeZone: "Asia/Manila" });
    // 11:59 PM on December 18 in Manila is 3:59 PM UTC.
    expect(body.recurrence).toEqual(["RRULE:FREQ=WEEKLY;UNTIL=20261218T155900Z"]);
    expect(body.summary).toBe("Calculus II");
    expect(body.location).toBe("Room 204");
  });

  it("starts a class with no term from the week it was added, and keeps repeating", () => {
    const base = source();
    const [body] = buildGoogleEvents({ ...base, subjects: [{ ...base.subjects[0], termId: null }] });
    // November 4, 2026 is a Wednesday, so the first Monday after it is November 9.
    expect(body.start).toMatchObject({ dateTime: "2026-11-09T08:00:00" });
    expect(body.recurrence).toEqual(["RRULE:FREQ=WEEKLY"]);
  });

  it("leaves out archived subjects, like the app's calendar", () => {
    const bodies = buildGoogleEvents(
      source({
        meetings: [{ ...source().meetings[0], subjectId: OTHER_SUBJECT }],
        events: [
          {
            id: EVENT,
            subjectId: OTHER_SUBJECT,
            title: "Old exam",
            type: "exam",
            startsAt: "2026-11-10T09:00",
            endsAt: null,
            allDay: false,
            completedAt: null,
          },
        ],
      }),
    );
    expect(bodies).toEqual([]);
  });

  it("makes all-day events end the next day, as Google expects", () => {
    const [body] = buildGoogleEvents(
      source({
        meetings: [],
        events: [
          {
            id: EVENT,
            subjectId: SUBJECT,
            title: "Problem set 4",
            type: "assignment",
            startsAt: "2026-11-20T00:00",
            endsAt: null,
            allDay: true,
            completedAt: null,
          },
        ],
      }),
    );
    expect(body.summary).toBe("Due: Problem set 4");
    expect(body.start).toEqual({ date: "2026-11-20" });
    expect(body.end).toEqual({ date: "2026-11-21" });
    expect(body.description).toContain("Assignment · Calculus II");
  });

  it("gives deadlines 15 minutes, without spilling past midnight", () => {
    const event = {
      id: EVENT,
      subjectId: null,
      title: "Submit essay",
      type: "task" as const,
      endsAt: null,
      allDay: false,
      completedAt: null,
    };
    const [morning] = buildGoogleEvents(source({ meetings: [], events: [{ ...event, startsAt: "2026-11-20T10:00" }] }));
    expect(morning.end).toEqual({ dateTime: "2026-11-20T10:15:00", timeZone: "Asia/Manila" });

    const [late] = buildGoogleEvents(source({ meetings: [], events: [{ ...event, startsAt: "2026-11-20T23:59" }] }));
    expect(late.end).toEqual({ dateTime: "2026-11-21T00:00:00", timeZone: "Asia/Manila" });
  });

  it("changes the hash only when the event changes", () => {
    const [first] = buildGoogleEvents(source());
    const [same] = buildGoogleEvents(source());
    const [moved] = buildGoogleEvents(source({ meetings: [{ ...source().meetings[0], startTime: "10:00" }] }));
    expect(same.extendedProperties.private.hash).toBe(first.extendedProperties.private.hash);
    expect(moved.extendedProperties.private.hash).not.toBe(first.extendedProperties.private.hash);
  });
});

describe("planChanges", () => {
  it("creates what's missing, updates what changed and removes what's gone", () => {
    const [body] = buildGoogleEvents(source());
    expect(planChanges([], [body]).create).toEqual([body]);

    const unchanged = planChanges([{ id: body.id, hash: body.extendedProperties.private.hash }], [body]);
    expect(unchanged).toEqual({ create: [], update: [], remove: [] });

    const stale = planChanges([{ id: body.id, hash: "old" }, { id: "egone1" }], [body]);
    expect(stale.update).toEqual([body]);
    expect(stale.remove).toEqual(["egone1"]);
  });
});

describe("GoogleCalendarApi", () => {
  function reply(status: number, body: unknown = {}) {
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  }

  it("restores an event when its ID is already taken", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply(409, { error: { message: "The requested identifier already exists." } }))
      .mockResolvedValueOnce(reply(200, {}));
    const api = new GoogleCalendarApi("token", fetchMock);
    const [body] = buildGoogleEvents(source());

    await api.insertEvent("cal@group.calendar.google.com", body);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(
      `https://www.googleapis.com/calendar/v3/calendars/cal%40group.calendar.google.com/events/${body.id}`,
    );
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body)).status).toBe("confirmed");
  });

  it("only lists the app's own events, across pages", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply(200, { items: [{ id: "ea", extendedProperties: { private: { hash: "1" } } }], nextPageToken: "p2" }))
      .mockResolvedValueOnce(reply(200, { items: [{ id: "eb" }] }));
    const events = await new GoogleCalendarApi("token", fetchMock).listAppEvents("cal");

    expect(events).toEqual([{ id: "ea", hash: "1" }, { id: "eb", hash: undefined }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("privateExtendedProperty=app%3Deducation-app");
    expect(String(fetchMock.mock.calls[1][0])).toContain("pageToken=p2");
  });

  it("treats an event that's already gone as deleted", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(reply(410, { error: { message: "Deleted" } }));
    await expect(new GoogleCalendarApi("token", fetchMock).deleteEvent("cal", "ea")).resolves.toBeUndefined();
  });

  it("reports a missing calendar instead of failing", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(reply(404, { error: { message: "Not Found" } }));
    await expect(new GoogleCalendarApi("token", fetchMock).calendarExists("cal")).resolves.toBe(false);
  });
});

describe("runLimited", () => {
  it("runs every task and collects failures instead of stopping", async () => {
    const done: number[] = [];
    const failures = await runLimited([1, 2, 3, 4, 5], 2, async (n) => {
      if (n === 3) throw new Error("boom");
      done.push(n);
    });
    expect(done.sort()).toEqual([1, 2, 4, 5]);
    expect(failures).toHaveLength(1);
  });
});
