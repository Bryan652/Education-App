import { Temporal } from "temporal-polyfill"
import { formatClock } from "@/lib/utils"

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
export const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const FALLBACK_TIMEZONE = "UTC"

export function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

/** Turns a time the student typed, like 2026-11-06T08:00, into an exact moment. */
export function localToUtc(local: string, timeZone: string) {
  return Temporal.PlainDateTime.from(local).toZonedDateTime(timeZone).toInstant().toString()
}

/** Turns an exact moment into the student's own clock time, like 2026-11-06T08:00. */
export function utcToLocal(moment: string, timeZone: string) {
  return Temporal.Instant.from(moment)
    .toZonedDateTimeISO(timeZone)
    .toPlainDateTime()
    .toString({ smallestUnit: "minute", roundingMode: "trunc" })
}

export function nowIn(timeZone: string) {
  return utcToLocal(Temporal.Now.instant().toString(), timeZone)
}

export function addDays(date: string, days: number) {
  return Temporal.PlainDate.from(date).add({ days }).toString()
}

/** 0 = Sunday through 6 = Saturday, matching class_meetings.day_of_week. */
export function dayOfWeek(date: string) {
  return Temporal.PlainDate.from(date).dayOfWeek % 7
}

/** Monday first, then the rest of the week, so a schedule reads the way a week does. */
export function byWeekOrder<T extends { dayOfWeek: number; startTime: string }>(meetings: T[]) {
  const weekIndex = (day: number) => (day + 6) % 7
  return [...meetings].sort(
    (a, b) => weekIndex(a.dayOfWeek) - weekIndex(b.dayOfWeek) || a.startTime.localeCompare(b.startTime),
  )
}

export function meetingSummary(meetings: { dayOfWeek: number; startTime: string }[]) {
  if (meetings.length === 0) return "No class times yet"
  const sorted = byWeekOrder(meetings)
  const days = sorted.map((meeting) => SHORT_DAY_NAMES[meeting.dayOfWeek]).join(", ")
  return `${days} · ${formatClock(sorted[0].startTime)}`
}

/**
 * The hours to show in the week view. It keeps the usual school day, and widens it
 * for anything outside that, so a deadline at 11:59 PM doesn't silently disappear.
 */
export function visibleHours(times: { start: string; end?: string | null }[]) {
  const hourOf = (time: string) => Number(time.split(":")[0])
  let first = 7
  let last = 20

  for (const { start, end } of times) {
    first = Math.min(first, hourOf(start))
    // Ends on the hour fill up to that hour. Anything later needs the next one too.
    const finish = end ?? start
    const finishHour = hourOf(finish) + (finish.endsWith(":00") && end ? 0 : 1)
    last = Math.max(last, Math.min(finishHour, 24))
  }

  const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`
  return { slotMinTime: clock(first), slotMaxTime: clock(last) }
}
