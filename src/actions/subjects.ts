"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NOTE_FILES_BUCKET } from "@/lib/notes/limits";
import { syncCalendarLater } from "@/lib/google/sync";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import {
  idSchema,
  PREVIEW_MESSAGE,
  SIGNED_OUT_MESSAGE,
  subjectSchema,
  type ActionResult,
  type FormState,
} from "@/lib/validation/subjects";

const MISSING_MESSAGE = "That subject no longer exists.";

// Subjects appear on nearly every page.
function refreshSubjectPages() {
  revalidatePath("/", "layout");
  // Names, terms and archiving all change what Google Calendar shows.
  syncCalendarLater();
}

function saveError(error: { code: string; message: string }): FormState {
  // A foreign key error here means the chosen term or scale was deleted, perhaps in another tab.
  if (error.code === "23503") {
    return error.message.includes("subjects_grading_scale_fkey")
      ? { status: "error", fieldErrors: { grading_scale_id: ["That grading scale no longer exists. Choose another."] } }
      : { status: "error", fieldErrors: { term_id: ["That term no longer exists. Choose another."] } };
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
    grading_scale_id: formData.get("grading_scale_id") ?? "",
  });
}

export async function createSubject(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseSubject(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("subjects").insert(parsed.data);
  if (error) return saveError(error);

  refreshSubjectPages();
  return { status: "success", message: `Added ${parsed.data.name}.` };
}

export async function updateSubject(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_MESSAGE };

  const parsed = parseSubject(formData);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  // Row-level security turns someone else's subject into zero rows, not an error, so check the count.
  const { data, error } = await session.supabase.from("subjects").update(parsed.data).eq("id", id).select("id");
  if (error) return saveError(error);
  if (data.length === 0) return { status: "error", message: MISSING_MESSAGE };

  refreshSubjectPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

async function setArchived(id: string, archivedAt: string | null, done: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
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

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };
  const { supabase } = session;

  const failed: ActionResult = { ok: false, message: "Couldn't delete this subject. Please try again." };

  // Deleting the subject removes its notes' rows, but not their stored files, so those go first.
  const files = await supabase.from("note_files").select("storage_path, notes!inner(subject_id)").eq("notes.subject_id", id);
  if (files.error) return failed;

  if (files.data.length > 0) {
    const removal = await supabase.storage.from(NOTE_FILES_BUCKET).remove(files.data.map((file) => file.storage_path));
    if (removal.error) return failed;
  }

  const { data, error } = await supabase.from("subjects").delete().eq("id", id).select("id");
  if (error) return failed;
  if (data.length === 0) return { ok: false, message: MISSING_MESSAGE };

  refreshSubjectPages();
  redirect("/subjects");
}
