import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { PreviewButton } from "@/components/layout/preview-button";
import { RestoreButton } from "@/components/subjects/subject-actions";
import { SubjectCard } from "@/components/subjects/subject-card";
import { SubjectFormDialog } from "@/components/subjects/subject-form-dialog";
import { termGpa } from "@/lib/grades/compute";
import { getSubjects, type SubjectRecord } from "@/lib/data/subjects";
import { gradeFor } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Subjects" };

function summary(subjects: SubjectRecord[]) {
  const units = subjects.reduce((sum, subject) => sum + subject.units, 0);
  const gpa = termGpa(
    subjects.map((subject) => ({
      units: subject.units,
      gradePoint: gradeFor(subject.id).band?.gradePoint ?? null,
    })),
  );
  return [
    `${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}`,
    units > 0 ? `${units} units` : null,
    gpa === null ? null : `${gpa.toFixed(2)} GPA so far`,
  ]
    .filter(Boolean)
    .join(" · ");
}

async function SubjectsContent() {
  const { active, archived, terms } = await getSubjects();

  const addButton = isSupabaseConfigured ? (
    <SubjectFormDialog terms={terms}>
      <Plus aria-hidden />
      Add subject
    </SubjectFormDialog>
  ) : (
    <PreviewButton size="lg">
      <Plus aria-hidden />
      Add subject
    </PreviewButton>
  );

  // Most recent term first, then anything without a term. Terms with no subjects are skipped.
  const groups = [
    ...terms.map((term) => ({
      key: term.id,
      title: term.name,
      subjects: active.filter((subject) => subject.termId === term.id),
    })),
    { key: "none", title: "No term", subjects: active.filter((subject) => !subject.termId) },
  ].filter((group) => group.subjects.length > 0);

  return (
    <>
      <PageHeader title="Subjects" description={active.length > 0 ? summary(active) : undefined} actions={addButton} />

      {active.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
          <BookOpen className="size-9 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 font-heading text-xl font-semibold">Add your first subject</h2>
          <p className="mt-1.5 max-w-sm text-muted-foreground">
            Your classes, notes, quiz cards and grades will all be organized around your subjects.
          </p>
          <div className="mt-5">{addButton}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key}>
              {(groups.length > 1 || group.key !== "none") && (
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">{group.title}</h2>
              )}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {group.subjects.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="mt-8 rounded-xl bg-card ring-1 ring-foreground/10">
          <summary className="cursor-pointer rounded-xl px-5 py-3.5 text-sm font-medium">
            Archived ({archived.length})
          </summary>
          <ul className="border-t px-5">
            {archived.map((subject) => (
              <li key={subject.id} className="flex items-center gap-3 border-b py-2.5 last:border-0">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden />
                <Link href={`/subjects/${subject.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
                  {subject.name}
                </Link>
                <RestoreButton subjectId={subject.id} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SubjectsContent />
    </Suspense>
  );
}
