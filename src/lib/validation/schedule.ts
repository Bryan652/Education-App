import { z } from "zod";
import { optionalId, optionalText } from "@/lib/validation/subjects";

export const EVENT_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "task", label: "Task" },
  { value: "other", label: "Other" },
] as const;

const clockTime = (message: string) => z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, message);

export const classMeetingSchema = z
  .object({
    subject_id: z.uuid("Choose a subject."),
    days: z
      .array(z.coerce.number().int().min(0).max(6))
      .min(1, "Choose at least one day.")
      .transform((days) => [...new Set(days)]),
    start_time: clockTime("Enter a start time."),
    end_time: clockTime("Enter an end time."),
    location: optionalText(100, "Location"),
  })
  .refine((meeting) => meeting.end_time > meeting.start_time, {
    path: ["end_time"],
    message: "The end time must be after the start time.",
  });

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title.").max(200, "Titles must be 200 characters or fewer."),
    type: z.enum(["assignment", "exam", "task", "other"], "Choose a type."),
    subject_id: optionalId("Choose a subject from the list."),
    date: z.iso.date("Enter a date."),
    all_day: z.boolean(),
    start_time: z.string(),
    end_time: z.string(),
  })
  .superRefine((event, context) => {
    if (event.all_day) return;

    if (!clockTime("").safeParse(event.start_time).success) {
      context.addIssue({ code: "custom", path: ["start_time"], message: "Enter a time, or choose all day." });
    }
    if (event.end_time && !clockTime("").safeParse(event.end_time).success) {
      context.addIssue({ code: "custom", path: ["end_time"], message: "Enter a valid time." });
    } else if (event.end_time && event.end_time <= event.start_time) {
      context.addIssue({ code: "custom", path: ["end_time"], message: "The end time must be after the start time." });
    }
  });
