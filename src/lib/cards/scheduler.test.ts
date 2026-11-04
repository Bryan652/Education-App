import { describe, expect, it } from "vitest"
import { intervalLabels, scheduleReview } from "@/lib/cards/scheduler"

const now = new Date("2026-11-04T08:00:00Z")
const daysLater = (iso: string, from = now) => (new Date(iso).getTime() - from.getTime()) / 86_400_000

describe("scheduleReview", () => {
  it("schedules a new card further out the better it was known", () => {
    const [again, hard, good, easy] = ([1, 2, 3, 4] as const).map((rating) => daysLater(scheduleReview(null, rating, now).dueAt))
    expect(again).toBeLessThan(hard)
    expect(hard).toBeLessThan(good)
    expect(good).toBeLessThan(easy)
  })

  it("never brings a card back the same day", () => {
    expect(daysLater(scheduleReview(null, 1, now).dueAt)).toBeGreaterThanOrEqual(1)
  })

  it("saves a state that survives being stored as JSON", () => {
    const { state } = scheduleReview(null, 3, now)
    const stored = JSON.parse(JSON.stringify(state))
    const later = new Date("2026-11-07T08:00:00Z")
    const next = scheduleReview(stored, 3, later)
    expect(next.state).toMatchObject({ reps: 2 })
  })

  it("spaces reviews further apart as a card keeps being known", () => {
    const first = scheduleReview(null, 3, now)
    const reviewedAt = new Date(first.dueAt)
    const second = scheduleReview(first.state, 3, reviewedAt)
    expect(daysLater(second.dueAt, reviewedAt)).toBeGreaterThan(daysLater(first.dueAt))
  })

  it("brings a known card back sooner after forgetting it", () => {
    const first = scheduleReview(null, 3, now)
    const reviewedAt = new Date(first.dueAt)
    const forgot = scheduleReview(first.state, 1, reviewedAt)
    const knew = scheduleReview(first.state, 3, reviewedAt)
    expect(daysLater(forgot.dueAt, reviewedAt)).toBeLessThan(daysLater(knew.dueAt, reviewedAt))
    expect(forgot.state).toMatchObject({ lapses: 1 })
  })

  it("treats an unreadable state as a new card", () => {
    expect(scheduleReview({ due: "not a date" }, 3, now).state).toMatchObject({ reps: 1 })
    expect(scheduleReview("garbage", 3, now).state).toMatchObject({ reps: 1 })
  })
})

describe("intervalLabels", () => {
  it("describes a new card's intervals in days", () => {
    expect(intervalLabels(null, now)).toEqual({ 1: "1 day", 2: "2 days", 3: "3 days", 4: "8 days" })
  })

  it("matches what a review would actually schedule", () => {
    const { state } = scheduleReview(null, 3, now)
    const later = new Date("2026-11-07T08:00:00Z")
    const labels = intervalLabels(state, later)
    const days = Math.round(daysLater(scheduleReview(state, 3, later).dueAt, later))
    expect(labels[3]).toBe(`${days} days`)
  })

  it("switches to months for long intervals", () => {
    let state = scheduleReview(null, 4, now).state
    let at = now
    for (let i = 0; i < 3; i++) {
      const next = scheduleReview(state, 4, at)
      at = new Date(next.dueAt)
      state = next.state
    }
    expect(intervalLabels(state, at)[4]).toMatch(/month|year/)
  })
})
