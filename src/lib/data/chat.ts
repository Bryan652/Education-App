import { connection } from "next/server";
import { CONTEXT_MAX_CHARS, fitText, type ChatContext } from "@/lib/ai/context";
import { chatThreads as sampleThreads, getNote as getSampleNote, getSubject as getSampleSubject, noteExcerpt, notes as sampleNotes } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/subjects";

export interface ThreadSummary {
  id: string;
  title: string;
  subjectId: string | null;
}

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ThreadDetail extends ThreadSummary {
  noteId: string | null;
  messages: ThreadMessage[];
}

const UNTITLED = "New chat";

export async function getThreads(): Promise<ThreadSummary[]> {
  if (!isSupabaseConfigured) {
    return sampleThreads.map(({ id, title, subjectId }) => ({ id, title, subjectId: subjectId ?? null }));
  }

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, subject_id")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Couldn't load your chats: ${error.message}`);

  return data.map((row) => ({ id: row.id, title: row.title ?? UNTITLED, subjectId: row.subject_id }));
}

export async function getThreadById(id: string): Promise<ThreadDetail | null> {
  if (!isSupabaseConfigured) {
    const sample = sampleThreads.find((thread) => thread.id === id);
    return sample
      ? {
          id: sample.id,
          title: sample.title,
          subjectId: sample.subjectId ?? null,
          noteId: sample.noteId ?? null,
          messages: sample.messages,
        }
      : null;
  }
  if (!idSchema.safeParse(id).success) return null;

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, subject_id, note_id, chat_messages(id, role, content, created_at)")
    .eq("id", id)
    .order("created_at", { referencedTable: "chat_messages" })
    .maybeSingle();
  if (error) throw new Error(`Couldn't load this chat: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    title: data.title ?? UNTITLED,
    subjectId: data.subject_id,
    noteId: data.note_id,
    messages: data.chat_messages.map((message) => ({
      id: message.id,
      role: message.role as ThreadMessage["role"],
      content: message.content,
    })),
  };
}

/** The note's text, up to the limit. The chat tells the student if it had to be cut. */
export async function getNoteContext(noteId: string): Promise<ChatContext | null> {
  if (!isSupabaseConfigured) {
    const sample = getSampleNote(noteId);
    return sample ? { kind: "note", id: sample.id, name: sample.title, ...fitText(noteExcerpt(sample)) } : null;
  }
  if (!idSchema.safeParse(noteId).success) return null;

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").select("id, title, plain_text").eq("id", noteId).maybeSingle();
  if (error) throw new Error(`Couldn't load this note: ${error.message}`);

  return data ? { kind: "note", id: data.id, name: data.title, ...fitText(data.plain_text ?? "") } : null;
}

function subjectText(notes: { title: string; text: string }[]) {
  const joined = notes.map((note) => `Note: ${note.title}\n${note.text}`).join("\n\n");
  return fitText(joined, CONTEXT_MAX_CHARS);
}

/** The subject's name and its most recently edited notes, up to the limit. */
export async function getSubjectContext(subjectId: string): Promise<ChatContext | null> {
  if (!isSupabaseConfigured) {
    const sample = getSampleSubject(subjectId);
    if (!sample) return null;
    const notes = sampleNotes
      .filter((note) => note.subjectId === subjectId)
      .map((note) => ({ title: note.title, text: noteExcerpt(note) }));
    return { kind: "subject", id: sample.id, name: sample.name, ...subjectText(notes) };
  }
  if (!idSchema.safeParse(subjectId).success) return null;

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, notes(title, plain_text, updated_at)")
    .eq("id", subjectId)
    .order("updated_at", { referencedTable: "notes", ascending: false })
    .maybeSingle();
  if (error) throw new Error(`Couldn't load this subject: ${error.message}`);
  if (!data) return null;

  return {
    kind: "subject",
    id: data.id,
    name: data.name,
    ...subjectText(data.notes.map((note) => ({ title: note.title, text: note.plain_text ?? "" }))),
  };
}
