import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DeckFormDialog } from "@/components/cards/card-dialogs";
import { DecksBrowser } from "@/components/cards/decks-browser";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { PreviewButton } from "@/components/layout/preview-button";
import { buttonVariants } from "@/components/ui/button";
import { getDecks } from "@/lib/data/cards";
import { getSubjects } from "@/lib/data/subjects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Quiz cards" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function DecksContent({ searchParams }: { searchParams: SearchParams }) {
  const { subject: subjectParam } = await searchParams;
  const [{ active, archived }, decks] = await Promise.all([getSubjects(), getDecks()]);

  const toOption = ({ id, name, color }: { id: string; name: string; color: string }) => ({ id, name, color });
  const subjects = [...active, ...archived].map(toOption);
  // An unknown subject in the URL falls back to showing everything.
  const selected = subjects.find((subject) => subject.id === subjectParam);
  // Archived subjects stay out of the way, unless one is what's being looked at.
  const filterSubjects = subjects.filter((subject) => active.some((item) => item.id === subject.id) || subject === selected);

  const visible = selected
    ? decks.filter((deck) => deck.subjectId === selected.id)
    : // "All subjects" lists the decks in the same order as the subjects.
      active.flatMap((subject) => decks.filter((deck) => deck.subjectId === subject.id));

  const activeOptions = active.map(({ id, name }) => ({ id, name }));
  const isActiveSubject = selected && active.some((subject) => subject.id === selected.id);

  function createButton(label: string) {
    if (!isSupabaseConfigured) {
      return (
        <PreviewButton size="lg" className="px-3">
          <Plus aria-hidden />
          {label}
        </PreviewButton>
      );
    }
    if (active.length === 0) {
      return (
        <Link href="/subjects" className={cn(buttonVariants({ size: "lg" }), "px-3")}>
          Add a subject first
        </Link>
      );
    }
    return (
      <DeckFormDialog
        subjects={activeOptions}
        subjectId={isActiveSubject ? selected.id : undefined}
        trigger={
          <>
            <Plus aria-hidden />
            {label}
          </>
        }
      />
    );
  }

  return (
    <>
      <PageHeader title="Quiz cards" actions={createButton("New deck")} />
      <DecksBrowser
        decks={visible}
        subjects={subjects}
        filterSubjects={filterSubjects}
        selected={selected}
        createDeckButton={createButton("Create a deck")}
      />
    </>
  );
}

export default function DecksPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DecksContent searchParams={searchParams} />
    </Suspense>
  );
}
