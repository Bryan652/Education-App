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
import { averageOnDefaultScale, type GradingScale } from "@/lib/grades/compute";
import { getGradesBySubject, getGradingScales, type SubjectGrade } from "@/lib/data/grades";
import { getClock } from "@/lib/data/profile";
import { getSchedule } from "@/lib/data/schedule";
import { getSubjects, type SubjectRecord } from "@/lib/data/subjects";
import { upcomingEvents } from "@/lib/schedule/calendar";
import { meetingSummary } from "@/lib/schedule/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { relativeDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Subjects" };

function summary(subjects: SubjectRecord[], grades: Map<string, SubjectGrade>, defaultScale: GradingScale) {
  const units = subjects.reduce((sum, subject) => sum + subject.units, 0);
  const { average, leftOut } = averageOnDefaultScale(
    subjects.map((subject) => {
      const entry = grades.get(subject.id);
      return {
        name: subject.name,
        units: subject.units,
        gradePoint: entry?.grade.gradePoint ?? null,
        scaleId: entry?.scale.id ?? null,
      };
    }),
    defaultScale.id,
  );

  const line = [
    `${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}`,
    units > 0 ? `${units} units` : null,
    average === null ? null : `${average.toFixed(2)} ${defaultScale.averageLabel} so far`,
  ]
    .filter(Boolean)
    .join(" · ");

  if (leftOut.length === 0) return line;
  return `${line}. ${leftOut.join(", ")} ${leftOut.length === 1 ? "isn't" : "aren't"} in the ${defaultScale.averageLabel} because ${leftOut.length === 1 ? "it uses" : "they use"} a different grading scale.`;
}

async function SubjectsContent() {
  const [{ active, archived, terms }, { scales, defaultScale }, { meetings, events }, { today }] = await Promise.all([
    getSubjects(),
    getGradingScales(),
    getSchedule(),
    getClock(),
  ]);
  const grades = await getGradesBySubject(active);
  const scaleOptions = scales.flatMap((scale) => (scale.id ? [{ id: scale.id, name: scale.name }] : []));
  const upcoming = upcomingEvents(events, today, [...active, ...archived]);

  const addButton = isSupabaseConfigured ? (
    <SubjectFormDialog terms={terms} scales={scaleOptions}>
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
      <PageHeader
        title="Subjects"
        description={active.length > 0 ? summary(active, grades, defaultScale) : undefined}
        actions={addButton}
      />

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
                {group.subjects.map((subject) => {
                  const next = upcoming.find((event) => event.subjectId === subject.id);
                  return (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      grade={grades.get(subject.id)?.grade}
                      meetingText={meetingSummary(meetings.filter((meeting) => meeting.subjectId === subject.id))}
                      nextText={next ? `${next.title} · ${relativeDay(today, next.startsAt)}` : "Nothing due soon"}
                    />
                  );
                })}
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
