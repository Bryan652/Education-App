import type { ReactNode } from "react";
import Link from "next/link";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import type { DeckSummary } from "@/lib/data/cards";
import { cn } from "@/lib/utils";

interface SubjectOption {
  id: string;
  name: string;
  color: string;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function SubjectFilter({ selectedId, options }: { selectedId: string | null; options: SubjectOption[] }) {
  const filters = [{ id: null as string | null, name: "All subjects" }, ...options];

  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by subject">
      {filters.map((filter) => {
        const selected = selectedId === filter.id;
        return (
          <Link
            key={filter.id ?? "all"}
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

// The selected subject comes from the URL, so reloading or sharing the link keeps it.
export function DecksBrowser({
  decks,
  subjects,
  filterSubjects,
  selected,
  createDeckButton,
}: {
  decks: DeckSummary[];
  subjects: SubjectOption[];
  filterSubjects: SubjectOption[];
  selected: SubjectOption | undefined;
  createDeckButton: ReactNode;
}) {
  const due = decks.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <>
      {filterSubjects.length > 0 && <SubjectFilter selectedId={selected?.id ?? null} options={filterSubjects} />}

      {decks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            {selected ? `${selected.name} doesn't have any quiz cards yet.` : "You don't have any quiz cards yet."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {createDeckButton}
            {selected && (
              <Link href="/decks" replace scroll={false} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}>
                Show all subjects
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {selected ? `${selected.name}: ` : ""}
            {plural(decks.length, "deck")} · {plural(due, "card")} due
          </p>
          <ul className="grid gap-5 sm:grid-cols-2">
            {decks.map((deck) => (
              <li key={deck.id} className="flex flex-col gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <div>
                  <SubjectBadge subject={subjects.find((subject) => subject.id === deck.subjectId)} />
                  <h2 className="mt-2.5 font-heading text-xl font-semibold">
                    <Link href={`/decks/${deck.id}`} className="hover:underline">
                      {deck.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plural(deck.cardCount, "card")}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-heading text-3xl font-semibold tabular-nums">{deck.dueCount}</span>
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
