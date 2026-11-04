import { cache } from "react";
import { connection } from "next/server";
import {
  decks as sampleDecks,
  dueCount as sampleDueCount,
  getDeck as getSampleDeck,
  type Deck as SampleDeck,
} from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/subjects";
import type { Json } from "@/types/database";

export interface DeckSummary {
  id: string;
  subjectId: string;
  name: string;
  cardCount: number;
  dueCount: number;
}

export interface CardRecord {
  id: string;
  front: string;
  back: string;
  due: boolean;
  // Null for sample cards, which all count as new.
  dueAt: string | null;
  state: Json | null;
}

export interface DeckDetail extends DeckSummary {
  cards: CardRecord[];
  // Sample decks are read-only, and only appear in the no-setup preview.
  isSample: boolean;
}

function sampleSummary(deck: SampleDeck): DeckSummary {
  return {
    id: deck.id,
    subjectId: deck.subjectId,
    name: deck.name,
    cardCount: deck.cards.length,
    dueCount: sampleDueCount(deck),
  };
}

/** Every deck, with how many cards each has and how many are due now. */
export const getDecks = cache(async (): Promise<DeckSummary[]> => {
  if (!isSupabaseConfigured) return sampleDecks.map(sampleSummary);

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.from("decks").select("id, subject_id, name, cards(due_at)").order("name");
  if (error) throw new Error(`Couldn't load decks: ${error.message}`);

  const now = Date.now();
  return data.map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    cardCount: row.cards.length,
    dueCount: row.cards.filter((card) => new Date(card.due_at).getTime() <= now).length,
  }));
});

export async function getSubjectDecks(subject: { id: string }) {
  return (await getDecks()).filter((deck) => deck.subjectId === subject.id);
}

export async function getDeckById(id: string): Promise<DeckDetail | null> {
  if (!isSupabaseConfigured) {
    const sample = getSampleDeck(id);
    if (!sample) return null;
    return {
      ...sampleSummary(sample),
      cards: sample.cards.map((card) => ({ ...card, dueAt: null, state: null })),
      isSample: true,
    };
  }
  if (!idSchema.safeParse(id).success) return null;

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id, subject_id, name, cards(id, front, back, due_at, fsrs_state, created_at)")
    .eq("id", id)
    .order("created_at", { referencedTable: "cards" })
    .maybeSingle();
  if (error) throw new Error(`Couldn't load this deck: ${error.message}`);
  if (!data) return null;

  const now = Date.now();
  const cards = data.cards.map<CardRecord>((card) => ({
    id: card.id,
    front: card.front,
    back: card.back,
    due: new Date(card.due_at).getTime() <= now,
    dueAt: card.due_at,
    state: card.fsrs_state,
  }));

  return {
    id: data.id,
    subjectId: data.subject_id,
    name: data.name,
    cardCount: cards.length,
    dueCount: cards.filter((card) => card.due).length,
    cards,
    isSample: false,
  };
}
