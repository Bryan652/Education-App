import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudySession } from "@/components/cards/study-session";
import { getDeckById } from "@/lib/data/cards";
import { getClock, getProfile } from "@/lib/data/profile";
import { getDeck as getSampleDeck } from "@/lib/mock-data";
import { utcToLocal } from "@/lib/schedule/time";
import { relativeDay } from "@/lib/utils";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  return { title: `Study ${getSampleDeck(deckId)?.name ?? "deck"}` };
}

export default async function StudyPage({ params }: Props) {
  const { deckId } = await params;
  const deck = await getDeckById(deckId);
  if (!deck) notFound();

  const [{ today }, { timezone }] = await Promise.all([getClock(), getProfile()]);

  // The longest overdue cards come first.
  const dueCards = deck.cards
    .filter((card) => card.due)
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));

  const soonest = deck.cards
    .flatMap((card) => (!card.due && card.dueAt ? [card.dueAt] : []))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  return (
    <StudySession
      deckId={deck.id}
      deckName={deck.name}
      cards={dueCards}
      allCards={deck.cards}
      nextDue={soonest ? relativeDay(today, utcToLocal(soonest, timezone)) : null}
      saves={!deck.isSample}
    />
  );
}
