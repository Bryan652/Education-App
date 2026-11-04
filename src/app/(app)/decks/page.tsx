import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { DecksBrowser } from "@/components/cards/decks-browser";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { getSubjects } from "@/lib/data/subjects";

export const metadata: Metadata = { title: "Quiz cards" };

// The decks are still samples until step 6, but the schedule links here with the student's own
// subjects. Knowing them lets this page say the subject has no decks, rather than show every sample.
async function DecksForSubjects() {
  const { active, archived } = await getSubjects();
  const ownSubjects = [...active, ...archived]
    .filter((subject) => !subject.isSample)
    .map(({ id, name }) => ({ id, name }));

  return <DecksBrowser ownSubjects={ownSubjects} />;
}

export default function DecksPage() {
  return (
    <>
      <PageHeader
        title="Quiz cards"
        actions={
          <PreviewButton size="lg">
            <Plus aria-hidden />
            New deck
          </PreviewButton>
        }
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-label="Loading decks" />}>
        <DecksForSubjects />
      </Suspense>
    </>
  );
}
