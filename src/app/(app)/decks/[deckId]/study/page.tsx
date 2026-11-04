import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudySession } from "@/components/cards/study-session";
import { getDeck } from "@/lib/mock-data";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  return { title: `Study ${getDeck(deckId)?.name ?? "deck"}` };
}

export default async function StudyPage({ params }: Props) {
  const { deckId } = await params;
  const deck = getDeck(deckId);
  if (!deck) notFound();

  return <StudySession deckId={deck.id} deckName={deck.name} cards={deck.cards.filter((card) => card.due)} />;
}
