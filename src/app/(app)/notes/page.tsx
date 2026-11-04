import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { PreviewButton } from "@/components/layout/preview-button";
import { NewNoteDialog } from "@/components/notes/note-dialogs";
import { NotesBrowser } from "@/components/notes/notes-browser";
import { buttonVariants } from "@/components/ui/button";
import { getNotes } from "@/lib/data/notes";
import { getClock } from "@/lib/data/profile";
import { getSubjects } from "@/lib/data/subjects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function asText(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

async function NotesContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = asText(params.q);
  const subjectId = asText(params.subject) || null;

  const [{ active, archived }, notes, { today }] = await Promise.all([
    getSubjects(),
    getNotes({ search, subjectId: subjectId ?? undefined }),
    getClock(),
  ]);

  const toOption = ({ id, name, color }: { id: string; name: string; color: string }) => ({ id, name, color });
  const allSubjects = [...active, ...archived].map(toOption);
  // Archived subjects only get a filter when they're the one being looked at.
  const filterSubjects = allSubjects.filter(
    (subject) => active.some((item) => item.id === subject.id) || subject.id === subjectId,
  );

  const isFiltered = Boolean(search || subjectId);
  const count = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  return (
    <>
      <PageHeader
        title="Notes"
        description={isFiltered ? count : `${count} across your subjects`}
        actions={
          !isSupabaseConfigured ? (
            <PreviewButton size="lg">
              <Plus aria-hidden />
              New note
            </PreviewButton>
          ) : active.length === 0 ? (
            <Link href="/subjects" className={cn(buttonVariants({ size: "lg" }), "px-3")}>
              Add a subject first
            </Link>
          ) : (
            <NewNoteDialog
              subjects={active.map(({ id, name }) => ({ id, name }))}
              subjectId={subjectId ?? undefined}
              trigger={
                <>
                  <Plus aria-hidden />
                  New note
                </>
              }
            />
          )
        }
      />
      <NotesBrowser
        notes={notes}
        subjects={allSubjects}
        filterSubjects={filterSubjects}
        search={search}
        subjectId={subjectId}
        today={today}
      />
    </>
  );
}

export default function NotesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotesContent searchParams={searchParams} />
    </Suspense>
  );
}
