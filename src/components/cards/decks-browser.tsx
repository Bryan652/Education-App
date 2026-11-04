"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PreviewButton } from "@/components/layout/preview-button";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import { decks, dueCount, getSubject, subjects } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const subjectOrder = subjects.map((subject) => subject.id);
const sortedDecks = [...decks].sort(
  (a, b) => subjectOrder.indexOf(a.subjectId) - subjectOrder.indexOf(b.subjectId),
);

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function SubjectFilter({ selectedId }: { selectedId: string | null }) {
  const filters = [{ id: null as string | null, name: "All subjects" }, ...subjects];

  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by subject">
      {filters.map((filter) => {
        const selected = selectedId === filter.id;
        return (
          <Link
            key={filter.name}
            href={filter.id ? `/decks?subject=${filter.id}` : "/decks"}
            replace
            scroll={false}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
              selected && "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {filter.name}
          </Link>
        );
      })}
    </nav>
  );
}

function DecksFromUrl() {
  const searchParams = useSearchParams();
  // An unknown subject in the URL falls back to showing everything.
  const subject = getSubject(searchParams.get("subject") ?? "");
  const visible = subject ? sortedDecks.filter((deck) => deck.subjectId === subject.id) : sortedDecks;
  const due = visible.reduce((sum, deck) => sum + dueCount(deck), 0);

  return (
    <>
      <SubjectFilter selectedId={subject?.id ?? null} />

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">{subject?.name} doesn&apos;t have any quiz cards yet.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <PreviewButton size="lg" className="px-4">Create a deck</PreviewButton>
            <Link href="/decks" replace scroll={false} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}>
              Show all subjects
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {subject ? `${subject.name}: ` : ""}
            {plural(visible.length, "deck")} · {plural(due, "card")} due
          </p>
          <ul className="grid gap-5 sm:grid-cols-2">
            {visible.map((deck) => (
              <li key={deck.id} className="flex flex-col gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <div>
                  <SubjectBadge subjectId={deck.subjectId} />
                  <h2 className="mt-2.5 font-heading text-xl font-semibold">
                    <Link href={`/decks/${deck.id}`} className="hover:underline">
                      {deck.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plural(deck.cards.length, "card")}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-heading text-3xl font-semibold tabular-nums">{dueCount(deck)}</span>
                    <span className="ml-1.5 text-muted-foreground">due</span>
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/decks/${deck.id}`} className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
                      View
                    </Link>
                    <Link href={`/decks/${deck.id}/study`} className={cn(buttonVariants({ size: "lg" }), "px-4")}>
                      Study
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export function DecksBrowser() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-label="Loading decks" />}>
      <DecksFromUrl />
    </Suspense>
  );
}
