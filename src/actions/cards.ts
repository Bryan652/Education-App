"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_GENERATED_CARDS } from "@/lib/ai/cards";
import { scheduleReview } from "@/lib/cards/scheduler";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import { cardSchema, deckSchema, ratingSchema } from "@/lib/validation/cards";
import {
  idSchema,
  PREVIEW_MESSAGE,
  SIGNED_OUT_MESSAGE,
  type ActionResult,
  type FormState,
} from "@/lib/validation/subjects";

const MISSING_DECK = "That deck no longer exists.";
const MISSING_CARD = "That card no longer exists.";
const MISSING_SUBJECT_FIELD: FormState = {
  status: "error",
  fieldErrors: { subject_id: ["That subject no longer exists. Choose another."] },
};

// Cards due appear on the dashboard and subject pages as well as the quiz card pages.
function refreshPages() {
  revalidatePath("/", "layout");
}

function fieldErrors(error: z.ZodError): FormState {
  return { status: "error", fieldErrors: z.flattenError(error).fieldErrors };
}

function parseDeck(formData: FormData) {
  return deckSchema.safeParse({ name: formData.get("name") ?? "", subject_id: formData.get("subject_id") ?? "" });
}

function parseCard(formData: FormData) {
  return cardSchema.safeParse({ front: formData.get("front") ?? "", back: formData.get("back") ?? "" });
}

export async function createDeck(formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };

  const parsed = parseDeck(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("decks").insert(parsed.data).select("id").single();
  if (error?.code === "23503") return MISSING_SUBJECT_FIELD;
  if (error) return { status: "error", message: "Couldn't create this deck. Please try again." };

  refreshPages();
  return { status: "success", message: `Created ${parsed.data.name}.`, redirectTo: `/decks/${data.id}` };
}

export async function updateDeck(id: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_DECK };

  const parsed = parseDeck(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("decks").update(parsed.data).eq("id", id).select("id");
  if (error?.code === "23503") return MISSING_SUBJECT_FIELD;
  if (error) return { status: "error", message: "Couldn't save this deck. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_DECK };

  refreshPages();
  return { status: "success", message: `Saved ${parsed.data.name}.` };
}

export async function deleteDeck(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_DECK };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("decks").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "Couldn't delete this deck. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_DECK };

  refreshPages();
  redirect("/decks");
}

export async function createCard(deckId: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(deckId).success) return { status: "error", message: MISSING_DECK };

  const parsed = parseCard(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { error } = await session.supabase.from("cards").insert({ ...parsed.data, deck_id: deckId });
  if (error?.code === "23503") return { status: "error", message: MISSING_DECK };
  if (error) return { status: "error", message: "Couldn't save this card. Please try again." };

  refreshPages();
  return { status: "success", message: "Added a card." };
}

/** Fixing a typo shouldn't lose a card's place in the schedule, so only the text changes. */
export async function updateCard(id: string, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { status: "error", message: MISSING_CARD };

  const parsed = parseCard(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const session = await signedInClient();
  if (!session) return { status: "error", message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("cards").update(parsed.data).eq("id", id).select("id");
  if (error) return { status: "error", message: "Couldn't save this card. Please try again." };
  if (data.length === 0) return { status: "error", message: MISSING_CARD };

  refreshPages();
  return { status: "success", message: "Saved this card." };
}

export async function deleteCard(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_CARD };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const { data, error } = await session.supabase.from("cards").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "Couldn't delete this card. Please try again." };
  if (data.length === 0) return { ok: false, message: MISSING_CARD };

  refreshPages();
  return { ok: true, message: "Deleted this card." };
}

const generatedDeckSchema = z.object({
  name: deckSchema.shape.name,
  cards: z.array(cardSchema).min(1, "Choose at least one card.").max(MAX_GENERATED_CARDS),
});

/** Saves AI-written cards as a new deck in the note's subject, linked back to the note. */
export async function createDeckFromNote(
  noteId: string,
  name: string,
  cards: { front: string; back: string }[],
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(noteId).success) return { ok: false, message: "That note no longer exists." };

  const parsed = generatedDeckSchema.safeParse({ name, cards });
  if (!parsed.success) return { ok: false, message: "Check the deck name and the cards, then try again." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };
  const { supabase } = session;

  const failed = { ok: false as const, message: "Couldn't save these cards. Please try again." };

  const note = await supabase.from("notes").select("subject_id").eq("id", noteId).maybeSingle();
  if (note.error) return failed;
  if (!note.data) return { ok: false, message: "That note no longer exists." };

  const deck = await supabase
    .from("decks")
    .insert({ name: parsed.data.name, subject_id: note.data.subject_id, source_note_id: noteId })
    .select("id")
    .single();
  if (deck.error) return failed;

  const inserted = await supabase.from("cards").insert(parsed.data.cards.map((card) => ({ ...card, deck_id: deck.data.id })));
  if (inserted.error) {
    // Don't leave an empty deck behind.
    await supabase.from("decks").delete().eq("id", deck.data.id);
    return failed;
  }

  refreshPages();
  return { ok: true, id: deck.data.id };
}

/** The server works out the schedule from the saved state, so the browser can't choose its own dates. */
export async function reviewCard(id: string, rating: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: PREVIEW_MESSAGE };
  if (!idSchema.safeParse(id).success) return { ok: false, message: MISSING_CARD };

  const parsedRating = ratingSchema.safeParse(rating);
  if (!parsedRating.success) return { ok: false, message: "Choose a rating." };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };
  const { supabase } = session;

  const failed: ActionResult = { ok: false, message: "Couldn't save that rating, so the card will come up again." };

  const card = await supabase.from("cards").select("fsrs_state").eq("id", id).maybeSingle();
  if (card.error) return failed;
  if (!card.data) return { ok: false, message: MISSING_CARD };

  const next = scheduleReview(card.data.fsrs_state, parsedRating.data, new Date());
  const { error } = await supabase.rpc("record_card_review", {
    p_card_id: id,
    p_rating: parsedRating.data,
    p_due_at: next.dueAt,
    p_fsrs_state: next.state,
  });
  if (error?.code === "P0002") return { ok: false, message: MISSING_CARD };
  if (error) return failed;

  refreshPages();
  return { ok: true, message: "Saved." };
}
