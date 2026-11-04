"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { idSchema, subjectSchema, type ActionResult, type FormState } from "@/lib/validation/subjects";

const PREVIEW_MESSAGE = "This is a preview, so nothing is saved yet.";
const SIGNED_OUT_MESSAGE = "Please sign in again, then try once more.";
const MISSING_MESSAGE = "That subject no longer exists.";

// Row-level security enforces who owns what. This check just gives a clearer message.
async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

function refreshSubjectPages() {
  revalidatePath("/subjects", "layout");
}

function saveError(code: string | undefined): FormState {
  // A foreign key error here means the chosen term was deleted, perhaps in another tab.
  if (code === "23503") {
    return { status: "error", fieldErrors: { term_id: ["That term no longer exists. Choose another."] } };
  }
  return { status: "error", message: "Couldn't save this subject. Please try again." };
}

function parseSubject(formData: FormData) {
  return subjectSchema.safeParse({
    name: formData.get("name") ?? "",
    code: formData.get("code") ?? "",
    instructor: formData.get("instructor") ?? "",
    color: formData.get("color") ?? "",
    units: formData.get("units") ?? "",
    term_id: formData.get("term_id") ?? "",
  });
}

export async function createSubject(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseSubject(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await signedInClient();
  if (!supabase) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await supabase.from("subjects").insert(parsed.data);
  if (error) return saveError(error.code);

  refreshSubjectPages();
  return { status: "success", message: `Added ${parsed.data.name}.` };
}

export async function updateSubject(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_MESSAGE };

  const parsed = parseSubject(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await signedInClient();
  if (!supabase) return { status: "error", message: SIGNED_OUT_MESSAGE };

  // Row-level security turns someone else's subject into zero rows, not an error, so check the count.
  const { data, error } = await supabase.from("subjects").update(parsed.data).eq("id", id).select("id");
  if (error) return saveError(error.code);
  if (data.length === 0) return { status: "error", message: MISSING_MESSAGE };

  refreshSubjectPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

async function setArchived(id: string, archivedAt: string | null, done: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_MESSAGE };

  const supabase = await signedInClient();
  if (!supabase) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await supabase
    .from("subjects")
    .update({ archived_at: archivedAt })
    .eq("id", id)
    .select("name");
  if (error) return { ok: false, message: "Couldn't update this subject. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_MESSAGE };

  refreshSubjectPages();
  return { ok: true, message: `${done} ${data[0].name}.` };
}

export async function archiveSubject(id: string): Promise<ActionResult> {
  return setArchived(id, new Date().toISOString(), "Archived");
}

export async function restoreSubject(id: string): Promise<ActionResult> {
  return setArchived(id, null, "Restored");
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_MESSAGE };

  const supabase = await signedInClient();
  if (!supabase) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await supabase.from("subjects").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "Couldn't delete this subject. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_MESSAGE };

  refreshSubjectPages();
  redirect("/subjects");
}
