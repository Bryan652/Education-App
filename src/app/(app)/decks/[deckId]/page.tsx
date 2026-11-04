import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import { dueCount, getDeck } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  return { title: getDeck(deckId)?.name ?? "Deck" };
}

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const deck = getDeck(deckId);
  if (!deck) notFound();

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/decks" className="hover:underline">
            ← All decks
          </Link>
        }
        title={deck.name}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <SubjectBadge subjectId={deck.subjectId} />
            {deck.cards.length} cards · {dueCount(deck)} due
          </span>
        }
        actions={
          <>
            <PreviewButton variant="outline" size="lg">
              <Plus aria-hidden />
              Add card
            </PreviewButton>
            <Link href={`/decks/${deck.id}/study`} className={cn(buttonVariants({ size: "lg" }), "px-4")}>
              Study
            </Link>
          </>
        }
      />
      <ul className="flex flex-col gap-3">
        {deck.cards.map((card) => (
          <li key={card.id} className="grid gap-x-6 gap-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <p className="font-medium">{card.front}</p>
            <p className="text-muted-foreground">{card.back}</p>
            {card.due && (
              <span className="w-fit rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-highlight-foreground">
                Due
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
