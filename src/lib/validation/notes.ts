import { z } from "zod";

export const NOTE_TITLE_MAX = 200;

export const noteTitle = z
  .string()
  .trim()
  .min(1, "Enter a title.")
  .max(NOTE_TITLE_MAX, `Titles must be ${NOTE_TITLE_MAX} characters or fewer.`);

export const newNoteSchema = z.object({
  title: noteTitle,
  subject_id: z.uuid("Choose a subject."),
});

export const uploadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().nonnegative(),
  type: z.string().max(255),
});
