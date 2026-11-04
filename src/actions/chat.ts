"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import { idSchema, optionalId, PREVIEW_MESSAGE, SIGNED_OUT_MESSAGE, type ActionResult } from "@/lib/validation/subjects";

const MISSING_THREAD = "That chat no longer exists.";
const FAILED_SAVE = "Couldn't save this message. Please try again.";
const MAX_MESSAGE_CHARS = 100_000;

type SavedResult = { ok: true; id: string } | { ok: false; message: string };

const messageText = z.string().trim().min(1).max(MAX_MESSAGE_CHARS);

const newThreadSchema = z.object({
  message: messageText,
  subject_id: optionalId("Choose a subject from the list."),
  note_id: optionalId("Choose a note from the list."),
});

// Chats appear in the list beside every conversation, and a new message reorders it.
function refreshPages() {
  revalidatePath("/", "layout");
}

/** Creates a chat with its first message. API keys never reach this code. */
export async function createChatThread(input: { message: string; subject_id: string; note_id: string }): Promise<SavedResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };

  const parsed = newThreadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a message." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { message, subject_id, note_id } = parsed.data;
  const title = message.replace(/\s+/g, " ").slice(0, 60);

  const { data, error } = await session.supabase.rpc("create_chat_thread", {
    // The generated types don't allow null for these two, but the function accepts it.
    p_subject_id: subject_id as string,
    p_note_id: note_id as string,
    p_title: title,
    p_message: message,
  });
  if (error?.code === "23503") return { ok: false, message: "That note or subject no longer exists." };
  if (error) return { ok: false, message: "Couldn't start this chat. Please try again." };

  refreshPages();
  return { ok: true, id: data };
}

export async function addChatMessage(threadId: string, role: "user" | "assistant", content: string): Promise<SavedResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(threadId).success) return { ok: false, message: MISSING_THREAD };
  if (role !== "user" && role !== "assistant") return { ok: false, message: FAILED_SAVE };

  const text = messageText.safeParse(content);
  if (!text.success) return { ok: false, message: "This message is empty or too long to save." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase
    .from("chat_messages")
    .insert({ thread_id: threadId, role, content: text.data })
    .select("id")
    .single();
  if (error?.code === "23503") return { ok: false, message: MISSING_THREAD };
  if (error) return { ok: false, message: FAILED_SAVE };

  refreshPages();
  return { ok: true, id: data.id };
}

export async function deleteChatThread(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_THREAD };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("chat_threads").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "Couldn't delete this chat. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_THREAD };

  refreshPages();
  redirect("/chat");
}
