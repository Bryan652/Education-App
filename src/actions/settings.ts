"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { idSchema, termSchema, type ActionResult, type FormState } from "@/lib/validation/subjects";

const PREVIEW_MESSAGE = "This is a preview, so nothing is saved yet.";
const SIGNED_OUT_MESSAGE = "Please sign in again, then try once more.";
const MISSING_MESSAGE = "That term no longer exists.";

async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

// Subjects show their term's name, so those pages need refreshing too.
function refreshTermPages() {
  revalidatePath("/settings");
  revalidatePath("/subjects", "layout");
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

  const supabase = await signedInClient();
  if (!supabase) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await supabase.from("terms").insert(parsed.data);
  if (error) return { status: "error", message: "Couldn't save this term. Please try again." };

  refreshTermPages();
  return { status: "success", message: `Added ${parsed.data.name}.` };
}

export async function updateTerm(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_MESSAGE };

  const parsed = parseTerm(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await signedInClient();
  if (!supabase) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await supabase.from("terms").update(parsed.data).eq("id", id).select("id");
  if (error) return { status: "error", message: "Couldn't save this term. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_MESSAGE };

  refreshTermPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

export async function deleteTerm(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_MESSAGE };

  const supabase = await signedInClient();
  if (!supabase) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await supabase.from("terms").delete().eq("id", id).select("name");
  if (error) return { ok: false, message: "Couldn't delete this term. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_MESSAGE };

  refreshTermPages();
  return { ok: true, message: `Deleted ${data[0].name}.` };
}
