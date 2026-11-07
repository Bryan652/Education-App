"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/data/profile";
import { localToUtc } from "@/lib/schedule/time";
import { syncCalendarLater } from "@/lib/google/sync";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import { classMeetingSchema, eventSchema } from "@/lib/validation/schedule";
import {
  idSchema,
  PREVIEW_MESSAGE,
  SIGNED_OUT_MESSAGE,
  type ActionResult,
  type FormState,
} from "@/lib/validation/subjects";

const MISSING_MEETING = "That class time no longer exists.";
const MISSING_EVENT = "That event no longer exists.";
const MISSING_SUBJECT_FIELD: FormState = {
  status: "error",
  fieldErrors: { subject_id: ["That subject no longer exists. Choose another."] },
};

// The schedule also appears on the dashboard and subject pages.
function refreshPages() {
  revalidatePath("/", "layout");
  syncCalendarLater();
}

function fieldErrors(error: z.ZodError): FormState {
  return { status: "error", fieldErrors: z.flattenError(error).fieldErrors };
}

function parseMeeting(formData: FormData) {
  return classMeetingSchema.safeParse({
    subject_id: formData.get("subject_id") ?? "",
    days: formData.getAll("days"),
    start_time: formData.get("start_time") ?? "",
    end_time: formData.get("end_time") ?? "",
    location: formData.get("location") ?? "",
  });
}

/** Adds one row per chosen day, so a Monday, Wednesday and Friday class takes one form. */
export async function createClassMeetings(formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseMeeting(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { days, ...meeting } = parsed.data;
  const { error } = await session.supabase
    .from("class_meetings")
    .insert(days.map((day_of_week) => ({ ...meeting, day_of_week })));
  if (error?.code === "23503") return MISSING_SUBJECT_FIELD;
  if (error) return { status: "error", message: "Couldn't save this class time. Please try again." };

  refreshPages();
  return { status: "success", message: days.length === 1 ? "Added a class time." : `Added ${days.length} class times.` };
}

export async function updateClassMeeting(id: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_MEETING };

  const parsed = parseMeeting(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { days, ...meeting } = parsed.data;
  const { data, error } = await session.supabase
    .from("class_meetings")
    .update({ ...meeting, day_of_week: days[0] })
    .eq("id", id)
    .select("id");
  if (error?.code === "23503") return MISSING_SUBJECT_FIELD;
  if (error) return { status: "error", message: "Couldn't save this class time. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_MEETING };

  refreshPages();
  return { status: "success", message: "Saved this class time." };
}

export async function deleteClassMeeting(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_MEETING };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("class_meetings").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "Couldn't delete this class time. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_MEETING };

  refreshPages();
  return { ok: true, message: "Deleted this class time." };
}

function parseEvent(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title") ?? "",
    type: formData.get("type") ?? "",
    subject_id: formData.get("subject_id") ?? "",
    date: formData.get("date") ?? "",
    all_day: formData.get("all_day") === "on",
    start_time: formData.get("start_time") ?? "",
    end_time: formData.get("end_time") ?? "",
  });
}

/**
 * Students type times on their own clock, so this needs their time zone to find the exact moment.
 * An all-day event is a date rather than a moment, so it stays on that date in every time zone.
 */
async function toEventRow(event: z.output<typeof eventSchema>) {
  const { timezone } = await getProfile();
  const at = (time: string) => localToUtc(`${event.date}T${time}`, timezone);

  return {
    title: event.title,
    type: event.type,
    subject_id: event.subject_id,
    all_day: event.all_day,
    starts_at: event.all_day ? localToUtc(`${event.date}T00:00`, "UTC") : at(event.start_time),
    ends_at: !event.all_day && event.end_time ? at(event.end_time) : null,
  };
}

export async function createEvent(formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseEvent(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("events").insert(await toEventRow(parsed.data));
  if (error?.code === "23503") return MISSING_SUBJECT_FIELD;
  if (error) return { status: "error", message: "Couldn't save this event. Please try again." };

  refreshPages();
  return { status: "success", message: `Added ${parsed.data.title}.` };
}

export async function updateEvent(id: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_EVENT };

  const parsed = parseEvent(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
    .from("events")
    .update(await toEventRow(parsed.data))
    .eq("id", id)
    .select("id");
  if (error?.code === "23503") return MISSING_SUBJECT_FIELD;
  if (error) return { status: "error", message: "Couldn't save this event. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_EVENT };

  refreshPages();
  return { status: "success", message: `Saved ${parsed.data.title}.` };
}

export async function setEventCompleted(id: string, completed: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_EVENT };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
    .from("events")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id)
    .select("title");
  if (error) return { ok: false, message: "Couldn't update this event. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_EVENT };

  refreshPages();
  return { ok: true, message: `${completed ? "Finished" : "Reopened"} ${data[0].title}.` };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_EVENT };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("events").delete().eq("id", id).select("title");
  if (error) return { ok: false, message: "Couldn't delete this event. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_EVENT };

  refreshPages();
  return { ok: true, message: `Deleted ${data[0].title}.` };
}
