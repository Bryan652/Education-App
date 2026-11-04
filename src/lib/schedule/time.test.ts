import { describe, expect, it } from "vitest"
import {
  addDays,
  byWeekOrder,
  dayOfWeek,
  isValidTimeZone,
  localToUtc,
  meetingSummary,
  utcToLocal,
  visibleHours,
} from "@/lib/schedule/time"

describe("time zones", () => {
  it("converts a student's clock time to an exact moment and back", () => {
    const moment = localToUtc("2026-11-06T08:00", "Asia/Manila")
    expect(moment).toBe("2026-11-06T00:00:00Z")
    expect(utcToLocal(moment, "Asia/Manila")).toBe("2026-11-06T08:00")
  })

  it("reads the format Supabase returns", () => {
    expect(utcToLocal("2026-11-06T00:00:00+00:00", "Asia/Manila")).toBe("2026-11-06T08:00")
  })

  it("moves to the next day when the time zone is ahead", () => {
    expect(utcToLocal("2026-11-04T23:00:00Z", "Asia/Manila")).toBe("2026-11-05T07:00")
  })

  it("follows daylight saving time", () => {
    expect(localToUtc("2026-07-01T09:00", "America/New_York")).toBe("2026-07-01T13:00:00Z")
    expect(localToUtc("2026-12-01T09:00", "America/New_York")).toBe("2026-12-01T14:00:00Z")
  })

  it("rejects made-up time zones", () => {
    expect(isValidTimeZone("Asia/Manila")).toBe(true)
    expect(isValidTimeZone("Mars/Olympus")).toBe(false)
  })
})

describe("dates", () => {
  it("numbers days the way class_meetings does", () => {
    expect(dayOfWeek("2026-11-01")).toBe(0) // Sunday
    expect(dayOfWeek("2026-11-04")).toBe(3) // Wednesday
    expect(dayOfWeek("2026-11-07")).toBe(6) // Saturday
  })

  it("adds days across a month end", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
  })
})

describe("meetings", () => {
  it("orders the week from Monday, with Sunday last", () => {
    const sorted = byWeekOrder([
      { dayOfWeek: 0, startTime: "08:00" },
      { dayOfWeek: 3, startTime: "10:00" },
      { dayOfWeek: 1, startTime: "09:00" },
      { dayOfWeek: 3, startTime: "08:00" },
    ])
    expect(sorted.map((meeting) => `${meeting.dayOfWeek} ${meeting.startTime}`)).toEqual([
      "1 09:00",
      "3 08:00",
      "3 10:00",
      "0 08:00",
    ])
  })

  it("summarizes class times", () => {
    expect(meetingSummary([])).toBe("No class times yet")
    expect(
      meetingSummary([
        { dayOfWeek: 3, startTime: "08:00" },
        { dayOfWeek: 1, startTime: "08:00" },
      ]),
    ).toBe("Mon, Wed · 8:00 AM")
  })
})

describe("visibleHours", () => {
  it("shows the usual school day by default", () => {
    expect(visibleHours([])).toEqual({ slotMinTime: "07:00:00", slotMaxTime: "20:00:00" })
  })

  it("widens for an early class", () => {
    expect(visibleHours([{ start: "05:30", end: "06:30" }]).slotMinTime).toBe("05:00:00")
  })

  it("keeps a late deadline with no end time on the grid", () => {
    expect(visibleHours([{ start: "23:59" }]).slotMaxTime).toBe("24:00:00")
  })

  it("doesn't widen past an end time that lands on the hour", () => {
    expect(visibleHours([{ start: "20:00", end: "21:00" }]).slotMaxTime).toBe("21:00:00")
  })

  it("widens for an end time partway through an hour", () => {
    expect(visibleHours([{ start: "20:00", end: "21:30" }]).slotMaxTime).toBe("22:00:00")
  })
})
