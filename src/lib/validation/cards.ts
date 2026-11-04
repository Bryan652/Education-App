import { z } from "zod";

export const CARD_TEXT_MAX = 2000;

export const deckSchema = z.object({
  name: z.string().trim().min(1, "Enter a deck name.").max(100, "Deck names must be 100 characters or fewer."),
  subject_id: z.uuid("Choose a subject."),
});

const cardText = (message: string) =>
  z.string().trim().min(1, message).max(CARD_TEXT_MAX, `This must be ${CARD_TEXT_MAX} characters or fewer.`);

export const cardSchema = z.object({
  front: cardText("Enter a question."),
  back: cardText("Enter an answer."),
});

export const ratingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
