import { addDays, dayOfWeek, visibleHours } from "@/lib/schedule/time"
import { formatClock } from "@/lib/utils"

export type EventType = "exam" | "assignment" | "task" | "other"

export interface ClassMeetingRecord {
  id: string
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
}

export interface EventRecord {
  id: string
  subjectId: string | null
  title: string
  type: EventType
  // The student's own clock time, like 2026-11-06T08:00.
  startsAt: string
  endsAt: string | null
  allDay: boolean
  completedAt: string | null
}

export interface ScheduleSubject {
  id: string
  name: string
  color: string
  termId: string | null
  archivedAt: string | null
}

export interface ScheduleTerm {
  id: string
  startDate: string
  endDate: string
}

const EVENT_TITLE_PREFIX: Partial<Record<EventType, string>> = { exam: "Exam: ", assignment: "Due: " }

/** The calendar title, shared with Google Calendar sync so both read the same. */
export function eventTitle(event: Pick<EventRecord, "title" | "type" | "completedAt">) {
  return event.completedAt ? `✓ ${event.title}` : `${EVENT_TITLE_PREFIX[event.type] ?? ""}${event.title}`
}

function colorsFor(color: string | undefined) {
  return {
    // Darkened so white event text stays readable on every subject color.
    color: `color-mix(in oklch, ${color ?? "#6b7280"} 82%, black)`,
    contrastColor: "#ffffff",
  }
}

// Anything tied to a subject opens that subject's quiz cards.
function linkFor(subjectId: string | null | undefined) {
  return subjectId ? { url: `/decks?subject=${subjectId}` } : {}
}

/** Everything the calendar shows. Archived subjects are hidden, along with their classes and events. */
export function buildCalendar({
  meetings,
  events,
  subjects,
  terms,
}: {
  meetings: ClassMeetingRecord[]
  events: EventRecord[]
  subjects: ScheduleSubject[]
  terms: ScheduleTerm[]
}) {
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  const termById = new Map(terms.map((term) => [term.id, term]))

  const visibleMeetings = meetings.filter((meeting) => {
    const subject = subjectById.get(meeting.subjectId)
    return subject && !subject.archivedAt
  })
  const visibleEvents = events.filter((event) => !event.subjectId || !subjectById.get(event.subjectId)?.archivedAt)

  const calendarEvents = [
    ...visibleMeetings.map((meeting) => {
      const subject = subjectById.get(meeting.subjectId)
      const term = subject?.termId ? termById.get(subject.termId) : undefined
      return {
        id: meeting.id,
        title: subject?.name ?? "Class",
        daysOfWeek: [meeting.dayOfWeek],
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        // Classes repeat through their term, and keep repeating if the subject has no term.
        // FullCalendar stops the day before endRecur, so add a day to include the last one.
        ...(term ? { startRecur: term.startDate, endRecur: addDays(term.endDate, 1) } : {}),
        ...colorsFor(subject?.color),
        ...linkFor(meeting.subjectId),
      }
    }),
    ...visibleEvents.map((event) => {
      const subject = event.subjectId ? subjectById.get(event.subjectId) : undefined
      const done = Boolean(event.completedAt)
      return {
        id: event.id,
        title: eventTitle(event),
        start: event.allDay ? event.startsAt.slice(0, 10) : event.startsAt,
        ...(event.endsAt && !event.allDay ? { end: event.endsAt } : {}),
        allDay: event.allDay,
        ...colorsFor(done ? undefined : subject?.color),
        ...linkFor(event.subjectId),
      }
    }),
  ]

  const timedEvents = visibleEvents.filter((event) => !event.allDay)
  return {
    calendarEvents,
    hasAllDayEvents: visibleEvents.some((event) => event.allDay),
    ...visibleHours([
      ...visibleMeetings.map((meeting) => ({ start: meeting.startTime, end: meeting.endTime })),
      ...timedEvents.map((event) => ({ start: event.startsAt.slice(11, 16), end: event.endsAt?.slice(11, 16) })),
    ]),
  }
}

/** Events still to come, soonest first. Finished ones and those for archived subjects are left out. */
export function upcomingEvents(events: EventRecord[], today: string, subjects: ScheduleSubject[]) {
  const archived = new Set(subjects.filter((subject) => subject.archivedAt).map((subject) => subject.id))
  return events
    .filter((event) => !event.completedAt && event.startsAt.slice(0, 10) >= today)
    .filter((event) => !event.subjectId || !archived.has(event.subjectId))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

export interface AgendaItem {
  id: string
  // Empty for all-day events, which sort first.
  time: string
  subjectId: string | null
  title: string
  detail: string
  isClass: boolean
}

export function todayAgenda({
  today,
  meetings,
  events,
  subjects,
  terms,
}: {
  today: string
  meetings: ClassMeetingRecord[]
  events: EventRecord[]
  subjects: ScheduleSubject[]
  terms: ScheduleTerm[]
}) {
  const weekday = dayOfWeek(today)

  const classes = meetings
    .filter((meeting) => {
      if (meeting.dayOfWeek !== weekday) return false
      const subject = subjects.find((item) => item.id === meeting.subjectId)
      if (!subject || subject.archivedAt) return false
      const term = terms.find((item) => item.id === subject.termId)
      return !term || (term.startDate <= today && today <= term.endDate)
    })
    .map<AgendaItem>((meeting) => ({
      id: meeting.id,
      time: meeting.startTime,
      subjectId: meeting.subjectId,
      title: subjects.find((item) => item.id === meeting.subjectId)?.name ?? "Class",
      detail: [`${formatClock(meeting.startTime)} – ${formatClock(meeting.endTime)}`, meeting.location]
        .filter(Boolean)
        .join(" · "),
      isClass: true,
    }))

  const due = upcomingEvents(events, today, subjects)
    .filter((event) => event.startsAt.slice(0, 10) === today)
    .map<AgendaItem>((event) => {
      const time = event.allDay ? "" : event.startsAt.slice(11, 16)
      return {
        id: event.id,
        time,
        subjectId: event.subjectId,
        title: event.title,
        detail: event.allDay ? "All day" : `Due ${formatClock(time)}`,
        isClass: false,
      }
    })

  return [...classes, ...due].sort((a, b) => a.time.localeCompare(b.time))
}
