"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EMPTY_NOTE_DOC, extractPlainText, isNoteDoc } from "@/lib/notes/content";
import { fileProblem, MAX_NOTE_BYTES, NOTE_FILES_BUCKET, safeStorageName } from "@/lib/notes/limits";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import { newNoteSchema, noteTitle, uploadSchema } from "@/lib/validation/notes";
import {
  idSchema,
  PREVIEW_MESSAGE,
  SIGNED_OUT_MESSAGE,
  type ActionResult,
  type FormState,
} from "@/lib/validation/subjects";

const MISSING_NOTE = "That note no longer exists.";
const MISSING_FILE = "That file no longer exists.";

// Notes appear on the dashboard and subject pages as well as the notes pages.
function refreshPages() {
  revalidatePath("/", "layout");
}

export async function createNote(formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = newNoteSchema.safeParse({
    title: formData.get("title") ?? "",
    subject_id: formData.get("subject_id") ?? "",
  });
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
    .from("notes")
    .insert({ ...parsed.data, content: EMPTY_NOTE_DOC, plain_text: "" })
    .select("id")
    .single();
  if (error?.code === "23503") {
    return { status: "error", fieldErrors: { subject_id: ["That subject no longer exists. Choose another."] } };
  }
  if (error) return { status: "error", message: "Couldn't create this note. Please try again." };

  refreshPages();
  return { status: "success", message: `Created ${parsed.data.title}.`, redirectTo: `/notes/${data.id}` };
}

/** Called by autosave. The server extracts the search text itself, so it can't drift from the note. */
export async function saveNote(id: string, input: { title: unknown; content: unknown }): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_NOTE };

  const title = noteTitle.safeParse(input.title);
  if (!title.success) return { ok: false, message: z.flattenError(title.error).formErrors[0] ?? "Enter a title." };
  if (!isNoteDoc(input.content)) return { ok: false, message: "Couldn't read this note. Please try again." };

  const content = input.content;
  if (new TextEncoder().encode(JSON.stringify(content)).length > MAX_NOTE_BYTES) {
    return { ok: false, message: "This note is too long to save. Try splitting it into two notes." };
  }

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
    .from("notes")
    .update({ title: title.data, content, plain_text: extractPlainText(content) })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: "Couldn't save this note. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_NOTE };

  refreshPages();
  return { ok: true, message: "Saved." };
}

export async function moveNote(id: string, subjectId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_NOTE };
  if (!idSchema.safeParse(subjectId).success) return { ok: false, message: "That subject no longer exists." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
    .from("notes")
    .update({ subject_id: subjectId })
    .eq("id", id)
    .select("id");
  if (error?.code === "23503") return { ok: false, message: "That subject no longer exists." };
  if (error) return { ok: false, message: "Couldn't move this note. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_NOTE };

  refreshPages();
  return { ok: true, message: "Moved this note." };
}

/** Deleting a row doesn't delete its stored files, so the files go first. */
export async function deleteNote(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_NOTE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };
  const { supabase } = session;

  const failed: ActionResult = { ok: false, message: "Couldn't delete this note. Please try again." };

  const files = await supabase.from("note_files").select("storage_path").eq("note_id", id);
  if (files.error) return failed;

  if (files.data.length > 0) {
    const removal = await supabase.storage.from(NOTE_FILES_BUCKET).remove(files.data.map((file) => file.storage_path));
    if (removal.error) return failed;
  }

  const { data, error } = await supabase.from("notes").delete().eq("id", id).select("id");
  if (error) return failed;
  if (data.length === 0) return { ok: false, message: MISSING_NOTE };

  refreshPages();
  redirect("/notes");
}

/**
 * Checks a file before the browser uploads it straight to Storage, because Server Actions
 * have a 1 MB request limit. Supabase enforces the same limits again on the upload itself.
 */
export async function prepareNoteUpload(
  noteId: string,
  file: { name: string; size: number; type: string },
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) return { ok: false, message: "This is a preview, so files can't be uploaded yet." };
  if (!idSchema.safeParse(noteId).success) return { ok: false, message: MISSING_NOTE };

  const parsed = uploadSchema.safeParse(file);
  if (!parsed.success) return { ok: false, message: "Couldn't read that file. Please try another." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };
  const { supabase, userId } = session;

  const failed = { ok: false as const, message: "Couldn't start this upload. Please try again." };

  const note = await supabase.from("notes").select("id").eq("id", noteId).maybeSingle();
  if (note.error) return failed;
  if (!note.data) return { ok: false, message: MISSING_NOTE };

  const used = await supabase.rpc("note_storage_used_bytes");
  if (used.error) return failed;

  const problem = fileProblem(parsed.data, used.data);
  if (problem) return { ok: false, message: problem };

  return { ok: true, path: `${userId}/${noteId}/${crypto.randomUUID()}-${safeStorageName(parsed.data.name)}` };
}

export async function recordNoteFile(
  noteId: string,
  path: string,
  file: { name: string; size: number; type: string },
): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(noteId).success) return { ok: false, message: MISSING_NOTE };

  const parsed = uploadSchema.safeParse(file);
  if (!parsed.success) return { ok: false, message: "Couldn't read that file. Please try another." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  if (!path.startsWith(`${session.userId}/${noteId}/`)) return { ok: false, message: "Couldn't attach this file." };

  const { error } = await session.supabase.from("note_files").insert({
    note_id: noteId,
    storage_path: path,
    file_name: parsed.data.name,
    mime_type: parsed.data.type,
    size_bytes: parsed.data.size,
  });
  if (error?.code === "23503") return { ok: false, message: MISSING_NOTE };
  if (error) return { ok: false, message: "Couldn't attach this file. Please try again." };

  refreshPages();
  return { ok: true, message: `Attached ${parsed.data.name}.` };
}

/** Files are private, so downloads go through a link that only works for a minute. */
export async function getNoteFileUrl(id: string): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) return { ok: false, message: "This is a preview, so files can't be downloaded yet." };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_FILE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const file = await session.supabase.from("note_files").select("storage_path, file_name").eq("id", id).maybeSingle();
  if (file.error) return { ok: false, message: "Couldn't download this file. Please try again." };
  if (!file.data) return { ok: false, message: MISSING_FILE };

  const { data, error } = await session.supabase.storage
    .from(NOTE_FILES_BUCKET)
    .createSignedUrl(file.data.storage_path, 60);
  if (error) return { ok: false, message: "Couldn't download this file. Please try again." };

  return { ok: true, url: data.signedUrl };
}

export async function deleteNoteFile(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_FILE };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };
  const { supabase } = session;

  const failed: ActionResult = { ok: false, message: "Couldn't delete this file. Please try again." };

  const file = await supabase.from("note_files").select("storage_path, file_name").eq("id", id).maybeSingle();
  if (file.error) return failed;
  if (!file.data) return { ok: false, message: MISSING_FILE };

  const removal = await supabase.storage.from(NOTE_FILES_BUCKET).remove([file.data.storage_path]);
  if (removal.error) return failed;

  const { error } = await supabase.from("note_files").delete().eq("id", id);
  if (error) return failed;

  refreshPages();
  return { ok: true, message: `Deleted ${file.data.file_name}.` };
}
