import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudySession } from "@/components/cards/study-session";
import { getDeckById } from "@/lib/data/cards";
import { getDeck as getSampleDeck } from "@/lib/mock-data";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  return { title: `Study ${getSampleDeck(deckId)?.name ?? "deck"}` };
}

export default async function StudyPage({ params }: Props) {
  const { deckId } = await params;
  const deck = await getDeckById(deckId);
  if (!deck) notFound();

  // The longest overdue cards come first.
  const dueCards = deck.cards
    .filter((card) => card.due)
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));

  return <StudySession deckId={deck.id} deckName={deck.name} cards={dueCards} saves={!deck.isSample} />;
}
