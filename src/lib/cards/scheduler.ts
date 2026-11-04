import { createEmptyCard, fsrs, generatorParameters, TypeConvert, type Card, type Grade } from "ts-fsrs"
import type { Json } from "@/types/database"

export const RATINGS = [
  { value: 1, label: "Again" },
  { value: 2, label: "Hard" },
  { value: 3, label: "Good" },
  { value: 4, label: "Easy" },
] as const

export type CardRating = (typeof RATINGS)[number]["value"]

// Schedules in whole days. The short-term mode brings cards back 10 minutes after finishing a
// session, which reads as if the session never ended. "Again" repeats the card in the session instead.
const scheduler = fsrs(generatorParameters({ enable_short_term: false }))

/** Cards with no saved state, or one that can't be read, are treated as new. */
function toCard(state: Json | null | undefined, now: Date): Card {
  if (!state) return createEmptyCard(now)
  try {
    const card = TypeConvert.card(state as unknown as Card)
    return Number.isNaN(card.due.getTime()) ? createEmptyCard(now) : card
  } catch {
    return createEmptyCard(now)
  }
}

/** The next due date and state after a review, ready to save. */
export function scheduleReview(state: Json | null | undefined, rating: CardRating, now: Date) {
  const { card } = scheduler.next(toCard(state, now), now, rating as Grade)
  return { dueAt: card.due.toISOString(), state: JSON.parse(JSON.stringify(card)) as Json }
}

function intervalLabel(from: Date, to: Date) {
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"}`
  if (days < 365) {
    const months = Math.round(days / 30)
    return `${months} ${months === 1 ? "month" : "months"}`
  }
  const years = Math.round((days / 365) * 10) / 10
  return `${years} ${years === 1 ? "year" : "years"}`
}

/** How long until the card comes back for each rating, shown on the rating buttons. */
export function intervalLabels(state: Json | null | undefined, now: Date) {
  const preview = scheduler.repeat(toCard(state, now), now)
  return Object.fromEntries(
    RATINGS.map(({ value }) => [value, intervalLabel(now, preview[value as Grade].card.due)]),
  ) as Record<CardRating, string>
}
