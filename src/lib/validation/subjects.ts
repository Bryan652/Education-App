import { z } from "zod";

export const SUBJECT_COLORS = [
  { name: "Blue", value: "#2f6fb0" },
  { name: "Green", value: "#2b8a67" },
  { name: "Purple", value: "#8b4fa3" },
  { name: "Red", value: "#c4533a" },
  { name: "Gold", value: "#a97b12" },
  { name: "Teal", value: "#1f7f8c" },
  { name: "Pink", value: "#b8477a" },
  { name: "Slate", value: "#5a6b82" },
];

export const DEFAULT_SUBJECT_COLOR = SUBJECT_COLORS[0].value;

export const PREVIEW_MESSAGE = "This is a preview, so nothing is saved yet.";
export const SIGNED_OUT_MESSAGE = "Please sign in again, then try once more.";

export const idSchema = z.uuid();

export const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null);

// A list picker where the first option means "none".
export const optionalId = (message: string) =>
  z.union([z.literal(""), z.uuid(message)]).transform((value) => value || null);

export const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a subject name.")
    .max(100, "Subject name must be 100 characters or fewer."),
  code: optionalText(30, "Code"),
  instructor: optionalText(100, "Instructor"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a color."),
  units: z
    .union([
      z.literal(""),
      z.coerce.number("Enter a number.").min(0, "Units can't be negative.").max(99.99, "Units must be below 100."),
    ])
    .transform((value) => (value === "" ? null : value)),
  term_id: optionalId("Choose a term from the list."),
  grading_scale_id: optionalId("Choose a grading scale from the list."),
});

export const termSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a term name.").max(100, "Term name must be 100 characters or fewer."),
    start_date: z.iso.date("Enter a start date."),
    end_date: z.iso.date("Enter an end date."),
  })
  .refine((term) => term.end_date >= term.start_date, {
    path: ["end_date"],
    message: "The end date can't be before the start date.",
  });

export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  // Where to go after saving, for forms that lead to a new page.
  redirectTo?: string;
}

export const initialFormState: FormState = { status: "idle" };

export interface ActionResult {
  ok: boolean;
  message: string;
}
