import { z } from "zod";

const requiredName = (label: string, max = 100) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .max(max, `That must be ${max} characters or fewer.`);

// An empty box means "not set" rather than zero.
const optionalNumber = (max: number, tooBig: string) =>
  z
    .union([
      z.literal(""),
      z.coerce.number("Enter a number.").min(0, "This can't be negative.").max(max, tooBig),
    ])
    .transform((value) => (value === "" ? null : value));

export const categorySchema = z.object({
  name: requiredName("a category name"),
  weight: z.coerce
    .number("Enter a number.")
    .gt(0, "Enter a weight above 0.")
    .max(100, "A weight can't be more than 100."),
});

export const gradeItemSchema = z.object({
  category_id: z.uuid("Choose a category."),
  name: requiredName("a name"),
  score: optionalNumber(99999.99, "That score is too large."),
  max_score: z.coerce
    .number("Enter a number.")
    .gt(0, "Enter a total above 0.")
    .max(99999.99, "That total is too large."),
  graded_on: z
    .union([z.literal(""), z.iso.date("Enter a valid date.")])
    .transform((value) => value || null),
});

const bandSchema = z.object({
  min_percent: z.coerce
    .number("Enter a minimum percent for every row.")
    .min(0, "Minimum percents can't be negative.")
    .max(100, "Minimum percents can't be above 100."),
  label: z
    .string()
    .trim()
    .min(1, "Enter a grade for every row.")
    .max(20, "Grades must be 20 characters or fewer."),
  grade_point: optionalNumber(99.99, "Grade points must be below 100."),
});

export const gradingScaleSchema = z.object({
  name: requiredName("a name"),
  higher_is_better: z.enum(["true", "false"]).transform((value) => value === "true"),
  passing_grade_point: optionalNumber(99.99, "The passing grade must be below 100."),
  average_label: requiredName("what the average is called", 20),
  base_percent: z
    .union([
      z.literal(""),
      z.coerce.number("Enter a number.").min(0, "The base can't be negative.").lt(100, "The base must be below 100."),
    ])
    .transform((value) => (value === "" ? 0 : value)),
  bands: z
    .array(bandSchema)
    .max(50, "A scale can have up to 50 grades.")
    .refine((bands) => new Set(bands.map((band) => band.min_percent)).size === bands.length, {
      message: "Each grade needs a different minimum percent.",
    })
    // Otherwise a low enough percent would have no grade at all.
    .refine((bands) => bands.length === 0 || bands.some((band) => band.min_percent === 0), {
      message: "The lowest grade must start at 0%.",
    }),
});
