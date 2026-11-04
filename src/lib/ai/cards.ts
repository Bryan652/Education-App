import { CARD_TEXT_MAX } from "@/lib/validation/cards"

export const MAX_GENERATED_CARDS = 30

export interface GeneratedCard {
  front: string
  back: string
}

export function cardPrompt(count: number) {
  return [
    `Write ${count} quiz cards that test the most important ideas in the student's material.`,
    "Each card has one clear question and a short answer. Only use what's in the material.",
    "Reply with only a JSON array, with no other text, like this:",
    '[{"front": "The question", "back": "The answer"}]',
  ].join(" ")
}

/** Models sometimes wrap JSON in a code fence or a sentence, so this finds the array inside. */
export function parseGeneratedCards(reply: string): GeneratedCard[] {
  const start = reply.indexOf("[")
  const end = reply.lastIndexOf("]")
  if (start === -1 || end <= start) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(reply.slice(start, end + 1))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed
    .flatMap((card): GeneratedCard[] => {
      const { front, back } = (card ?? {}) as { front?: unknown; back?: unknown }
      if (typeof front !== "string" || typeof back !== "string") return []
      const cleanFront = front.trim().slice(0, CARD_TEXT_MAX)
      const cleanBack = back.trim().slice(0, CARD_TEXT_MAX)
      return cleanFront && cleanBack ? [{ front: cleanFront, back: cleanBack }] : []
    })
    .slice(0, MAX_GENERATED_CARDS)
}
