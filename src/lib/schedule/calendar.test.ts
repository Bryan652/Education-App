import { describe, expect, it } from "vitest"
import {
  buildCalendar,
  todayAgenda,
  upcomingEvents,
  type ClassMeetingRecord,
  type EventRecord,
  type ScheduleSubject,
} from "@/lib/schedule/calendar"

const subject: ScheduleSubject = { id: "s1", name: "Calculus", color: "#2f6fb0", termId: "t1", archivedAt: null }
const archived: ScheduleSubject = { id: "s2", name: "Old class", color: "#111111", termId: null, archivedAt: "2026-01-01" }
const noTerm: ScheduleSubject = { id: "s3", name: "Club", color: "#222222", termId: null, archivedAt: null }
const subjects = [subject, archived, noTerm]
const terms = [{ id: "t1", startDate: "2026-08-10", endDate: "2026-12-18" }]

function meeting(overrides: Partial<ClassMeetingRecord> = {}): ClassMeetingRecord {
  return { id: "m1", subjectId: "s1", dayOfWeek: 3, startTime: "08:00", endTime: "09:30", location: "Room 1", ...overrides }
}

function event(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: "e1",
    subjectId: "s1",
    title: "Quiz",
    type: "exam",
    startsAt: "2026-11-06T08:00",
    endsAt: null,
    allDay: false,
    completedAt: null,
    ...overrides,
  }
}

describe("buildCalendar", () => {
  const build = (meetings: ClassMeetingRecord[], events: EventRecord[]) =>
    buildCalendar({ meetings, events, subjects, terms })

  it("repeats classes through their term, including the last day", () => {
    const [calendarEvent] = build([meeting()], []).calendarEvents
    expect(calendarEvent).toMatchObject({ startRecur: "2026-08-10", endRecur: "2026-12-19", daysOfWeek: [3] })
  })

  it("keeps repeating classes for a subject with no term", () => {
    const [calendarEvent] = build([meeting({ subjectId: "s3" })], []).calendarEvents
    expect(calendarEvent).not.toHaveProperty("startRecur")
    expect(calendarEvent).not.toHaveProperty("endRecur")
  })

  it("links subject items to that subject's quiz cards", () => {
    const { calendarEvents } = build([meeting()], [event()])
    expect(calendarEvents.map((item) => item.url)).toEqual(["/decks?subject=s1", "/decks?subject=s1"])
  })

  it("doesn't link personal events anywhere", () => {
    const [calendarEvent] = build([], [event({ subjectId: null })]).calendarEvents
    expect(calendarEvent.url).toBeUndefined()
  })

  it("hides classes and events for archived subjects", () => {
    const { calendarEvents } = build([meeting({ subjectId: "s2" })], [event({ subjectId: "s2" })])
    expect(calendarEvents).toEqual([])
  })

  it("marks finished events and doesn't call them due", () => {
    const [calendarEvent] = build([], [event({ type: "assignment", completedAt: "2026-11-01" })]).calendarEvents
    expect(calendarEvent.title).toBe("✓ Quiz")
  })

  it("shows all-day events by date, with no end", () => {
    const result = build([], [event({ allDay: true, startsAt: "2026-11-06T00:00" })])
    expect(result.hasAllDayEvents).toBe(true)
    expect(result.calendarEvents[0]).toMatchObject({ start: "2026-11-06", allDay: true })
  })

  it("widens the visible hours for a late deadline", () => {
    expect(build([], [event({ startsAt: "2026-11-06T23:59" })]).slotMaxTime).toBe("24:00:00")
  })

  it("ignores all-day events when working out the visible hours", () => {
    expect(build([], [event({ allDay: true, startsAt: "2026-11-06T00:00" })]).slotMinTime).toBe("07:00:00")
  })
})

describe("upcomingEvents", () => {
  it("keeps today and later, soonest first", () => {
    const list = upcomingEvents(
      [
        event({ id: "later", startsAt: "2026-11-09T08:00" }),
        event({ id: "past", startsAt: "2026-11-03T08:00" }),
        event({ id: "today", startsAt: "2026-11-04T23:00" }),
      ],
      "2026-11-04",
      subjects,
    )
    expect(list.map((item) => item.id)).toEqual(["today", "later"])
  })

  it("leaves out finished events and archived subjects, but keeps personal ones", () => {
    const list = upcomingEvents(
      [
        event({ id: "done", completedAt: "2026-11-01" }),
        event({ id: "archived", subjectId: "s2" }),
        event({ id: "personal", subjectId: null }),
      ],
      "2026-11-04",
      subjects,
    )
    expect(list.map((item) => item.id)).toEqual(["personal"])
  })
})

describe("todayAgenda", () => {
  // November 4, 2026 is a Wednesday.
  const agenda = (today: string, meetings: ClassMeetingRecord[], events: EventRecord[] = []) =>
    todayAgenda({ today, meetings, events, subjects, terms })

  it("only includes classes on that weekday", () => {
    expect(agenda("2026-11-04", [meeting(), meeting({ id: "m2", dayOfWeek: 4 })]).map((item) => item.id)).toEqual(["m1"])
  })

  it("leaves out classes outside their term", () => {
    expect(agenda("2027-01-06", [meeting()])).toEqual([])
    expect(agenda("2026-12-16", [meeting()])).toHaveLength(1)
  })

  it("includes classes on the term's first and last days", () => {
    expect(agenda("2026-12-18", [meeting({ dayOfWeek: 5 })])).toHaveLength(1)
    expect(agenda("2026-08-10", [meeting({ dayOfWeek: 1 })])).toHaveLength(1)
  })

  it("leaves out classes for archived subjects", () => {
    expect(agenda("2026-11-04", [meeting({ subjectId: "s2" })])).toEqual([])
  })

  it("mixes classes and events in time order, with all-day events first", () => {
    const items = agenda(
      "2026-11-04",
      [meeting()],
      [
        event({ id: "evening", startsAt: "2026-11-04T18:00", title: "Essay" }),
        event({ id: "all-day", startsAt: "2026-11-04T00:00", allDay: true, title: "Holiday" }),
      ],
    )
    expect(items.map((item) => item.id)).toEqual(["all-day", "m1", "evening"])
    expect(items[0].detail).toBe("All day")
    expect(items[1].detail).toBe("8:00 AM – 9:30 AM · Room 1")
    expect(items[2].detail).toBe("Due 6:00 PM")
  })

  it("leaves out the separator when a class has no location", () => {
    expect(agenda("2026-11-04", [meeting({ location: "" })])[0].detail).toBe("8:00 AM – 9:30 AM")
  })
})
