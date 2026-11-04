import { connection } from "next/server";
import { getProfile } from "@/lib/data/profile";
import { getNote as getSampleNote, noteExcerpt, notes as sampleNotes, type Note as SampleNote } from "@/lib/mock-data";
import { toSearchQuery } from "@/lib/notes/content";
import { formatBytes } from "@/lib/notes/limits";
import { utcToLocal } from "@/lib/schedule/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/subjects";
import type { Json } from "@/types/database";

const EXCERPT_LENGTH = 200;
const MAX_LISTED_NOTES = 200;

export interface NoteListItem {
  id: string;
  subjectId: string;
  title: string;
  updatedAt: string;
  excerpt: string;
}

export interface NoteFileRecord {
  id: string;
  fileName: string;
  size: string;
}

export interface NoteDetail {
  id: string;
  subjectId: string;
  title: string;
  updatedAt: string;
  // A Tiptap document, or HTML for the sample notes.
  content: Json | string;
  files: NoteFileRecord[];
  // Used for making cards. The editor keeps its own copy as the student types.
  plainText: string;
  // Sample notes are read-only, and only appear in the no-setup preview.
  isSample: boolean;
}

function sampleListItem(note: SampleNote): NoteListItem {
  return {
    id: note.id,
    subjectId: note.subjectId,
    title: note.title,
    updatedAt: note.updatedAt,
    excerpt: noteExcerpt(note).slice(0, EXCERPT_LENGTH),
  };
}

function searchSampleNotes(search: string, subjectId?: string) {
  const query = search.trim().toLowerCase();
  return [...sampleNotes]
    .filter((note) => !subjectId || note.subjectId === subjectId)
    .filter((note) => !query || `${note.title} ${noteExcerpt(note)}`.toLowerCase().includes(query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(sampleListItem);
}

export async function getNotes({ search = "", subjectId, limit }: { search?: string; subjectId?: string; limit?: number } = {}) {
  if (!isSupabaseConfigured) {
    const notes = searchSampleNotes(search, subjectId);
    return limit ? notes.slice(0, limit) : notes;
  }

  if (subjectId && !idSchema.safeParse(subjectId).success) return [];

  await connection();
  const supabase = await createClient();
  const { timezone } = await getProfile();

  let query = supabase
    .from("notes")
    .select("id, subject_id, title, plain_text, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit ?? MAX_LISTED_NOTES);

  if (subjectId) query = query.eq("subject_id", subjectId);

  const searchQuery = toSearchQuery(search);
  if (searchQuery) query = query.textSearch("search_vector", searchQuery, { config: "english" });

  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load notes: ${error.message}`);

  return data.map<NoteListItem>((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    updatedAt: utcToLocal(row.updated_at, timezone),
    excerpt: (row.plain_text ?? "").replace(/\s+/g, " ").slice(0, EXCERPT_LENGTH),
  }));
}

export async function getNoteById(id: string): Promise<NoteDetail | null> {
  if (!isSupabaseConfigured) {
    const sample = getSampleNote(id);
    if (!sample) return null;
    return {
      id: sample.id,
      subjectId: sample.subjectId,
      title: sample.title,
      updatedAt: sample.updatedAt,
      content: sample.html,
      files: sample.files,
      plainText: noteExcerpt(sample),
      isSample: true,
    };
  }
  if (!idSchema.safeParse(id).success) return null;

  await connection();
  const supabase = await createClient();
  const [{ timezone }, result] = await Promise.all([
    getProfile(),
    supabase
      .from("notes")
      .select("id, subject_id, title, content, plain_text, updated_at, note_files(id, file_name, size_bytes, created_at)")
      .eq("id", id)
      .order("created_at", { referencedTable: "note_files" })
      .maybeSingle(),
  ]);
  if (result.error) throw new Error(`Couldn't load this note: ${result.error.message}`);
  if (!result.data) return null;

  return {
    id: result.data.id,
    subjectId: result.data.subject_id,
    title: result.data.title,
    updatedAt: utcToLocal(result.data.updated_at, timezone),
    content: result.data.content,
    plainText: result.data.plain_text ?? "",
    files: result.data.note_files.map((file) => ({
      id: file.id,
      fileName: file.file_name,
      size: formatBytes(file.size_bytes ?? 0),
    })),
    isSample: false,
  };
}

/** How many bytes of file storage the student is using. */
export async function getStorageUsed() {
  if (!isSupabaseConfigured) return 0;

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("note_storage_used_bytes");
  if (error) throw new Error(`Couldn't load your storage use: ${error.message}`);
  return data;
}
