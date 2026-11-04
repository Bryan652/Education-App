"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
