"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidTimeZone } from "@/lib/schedule/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import {
  idSchema,
  optionalText,
  PREVIEW_MESSAGE,
  SIGNED_OUT_MESSAGE,
  termSchema,
  type ActionResult,
  type FormState,
} from "@/lib/validation/subjects";

const MISSING_MESSAGE = "That term no longer exists.";

// Terms decide when classes repeat, and the time zone changes how every date reads.
function refreshPages() {
  revalidatePath("/", "layout");
}

function parseTerm(formData: FormData) {
  return termSchema.safeParse({
    name: formData.get("name") ?? "",
    start_date: formData.get("start_date") ?? "",
    end_date: formData.get("end_date") ?? "",
  });
}

export async function createTerm(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseTerm(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("terms").insert(parsed.data);
  if (error) return { status: "error", message: "Couldn't save this term. Please try again." };

  refreshPages();
  return { status: "success", message: `Added ${parsed.data.name}.` };
}

export async function updateTerm(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_MESSAGE };

  const parsed = parseTerm(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("terms").update(parsed.data).eq("id", id).select("id");
  if (error) return { status: "error", message: "Couldn't save this term. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_MESSAGE };

  refreshPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

export async function deleteTerm(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("terms").delete().eq("id", id).select("name");
  if (error) return { ok: false, message: "Couldn't delete this term. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_MESSAGE };

  refreshPages();
  return { ok: true, message: `Deleted ${data[0].name}.` };
}

const profileSchema = z.object({
  display_name: optionalText(100, "Name"),
  timezone: z.string().refine(isValidTimeZone, "Choose a time zone from the list."),
});

export async function updateProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    timezone: formData.get("timezone") ?? "",
  });
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("profiles").update(parsed.data).eq("id", session.userId);
  if (error) return { status: "error", message: "Couldn't save your profile. Please try again." };

  refreshPages();
  return { status: "success", message: "Saved your profile." };
}

/** Fills in the time zone from the browser, once. It never overwrites one the student chose. */
export async function saveDetectedTimezone(timezone: string): Promise<void> {
  if (!isSupabaseConfigured || !isValidTimeZone(timezone)) return;

  const session = await signedInClient();
  if (!session) return;

  const { error } = await session.supabase
    .from("profiles")
    .update({ timezone })
    .eq("id", session.userId)
    .is("timezone", null);
  if (!error) refreshPages();
}
