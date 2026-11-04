import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { CardFormDialog, DeckFormDialog, DeleteCardButton, DeleteDeckButton } from "@/components/cards/card-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import { getDeckById } from "@/lib/data/cards";
import { getSubjectById, getSubjects } from "@/lib/data/subjects";
import { getDeck as getSampleDeck } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  return { title: getSampleDeck(deckId)?.name ?? "Deck" };
}

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const deck = await getDeckById(deckId);
  if (!deck) notFound();

  const [subject, { active }] = await Promise.all([getSubjectById(deck.subjectId), getSubjects()]);
  const editable = !deck.isSample;

  // Includes the deck's own subject, in case it's been archived.
  const subjectOptions = [
    ...active,
    ...(subject && !active.some((item) => item.id === subject.id) ? [subject] : []),
  ].map(({ id, name }) => ({ id, name }));

  const addCard = (label: string) =>
    editable ? (
      <CardFormDialog
        deckId={deck.id}
        triggerProps={{ variant: "outline" }}
        trigger={
          <>
            <Plus aria-hidden />
            {label}
          </>
        }
      />
    ) : (
      <PreviewButton variant="outline" size="lg">
        <Plus aria-hidden />
        {label}
      </PreviewButton>
    );

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
            <SubjectBadge subject={subject ?? undefined} />
            {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"} · {deck.dueCount} due
          </span>
        }
        actions={
          <>
            {editable && (
              <>
                <DeckFormDialog
                  deck={deck}
                  subjects={subjectOptions}
                  triggerProps={{ variant: "ghost" }}
                  trigger={
                    <>
                      <Pencil aria-hidden />
                      Edit
                    </>
                  }
                />
                <DeleteDeckButton deck={deck} />
              </>
            )}
            {addCard("Add card")}
            <Link href={`/decks/${deck.id}/study`} className={cn(buttonVariants({ size: "lg" }), "px-4")}>
              Study
            </Link>
          </>
        }
      />

      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">This deck doesn&apos;t have any cards yet.</p>
          {addCard("Add your first card")}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {deck.cards.map((card) => (
            <li
              key={card.id}
              className="grid gap-x-6 gap-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
            >
              <p className="font-medium wrap-anywhere whitespace-pre-wrap">{card.front}</p>
              <p className="text-muted-foreground wrap-anywhere whitespace-pre-wrap">{card.back}</p>
              <div className="flex items-center gap-1">
                {card.due && (
                  <span className="mr-1 w-fit rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-highlight-foreground">
                    Due
                  </span>
                )}
                {editable && (
                  <>
                    <CardFormDialog
                      deckId={deck.id}
                      card={card}
                      triggerProps={{
                        variant: "ghost",
                        size: "icon-lg",
                        className: "",
                        "aria-label": `Edit card: ${card.front.slice(0, 40)}`,
                      }}
                      trigger={<Pencil aria-hidden />}
                    />
                    <DeleteCardButton card={card} />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
