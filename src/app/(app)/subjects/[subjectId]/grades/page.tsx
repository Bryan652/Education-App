import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, TriangleAlert } from "lucide-react";
import { CategoryCard } from "@/components/grades/category-card";
import { CategoryFormDialog, GradeItemFormDialog } from "@/components/grades/grade-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { getSubjectGrades } from "@/lib/data/grades";
import { getSubjectById } from "@/lib/data/subjects";
import { getSubject as getSampleSubject } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: `${getSampleSubject(subjectId)?.name ?? "Subject"} grades` };
}

export default async function SubjectGradesPage({ params }: Props) {
  const { subjectId } = await params;
  const subject = await getSubjectById(subjectId);
  if (!subject) notFound();

  const { categories, scale, grade } = await getSubjectGrades(subject);
  const editable = !subject.isSample;
  const categoryOptions = categories.map(({ id, name }) => ({ id, name }));

  const actions = editable ? (
    <>
      <CategoryFormDialog
        subjectId={subject.id}
        triggerProps={{ variant: categories.length > 0 ? "outline" : "default" }}
        trigger={
          <>
            <Plus aria-hidden />
            Add category
          </>
        }
      />
      {categories.length > 0 && (
        <GradeItemFormDialog
          categories={categoryOptions}
          trigger={
            <>
              <Plus aria-hidden />
              Add score
            </>
          }
        />
      )}
    </>
  ) : (
    <>
      <PreviewButton variant="outline" size="lg">Add category</PreviewButton>
      <PreviewButton size="lg">Add score</PreviewButton>
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/subjects/${subject.id}`} className="hover:underline">
            ← {subject.name}
          </Link>
        }
        title="Grades"
        actions={actions}
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-10 gap-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current grade</p>
          <p
            className={cn(
              "mt-1 font-heading text-6xl font-semibold",
              grade.passing === false ? "text-destructive" : "subject-text",
            )}
            style={{ "--subject": subject.color } as CSSProperties}
          >
            {grade.label ?? "–"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Percent so far</p>
          <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
            {grade.percent === null ? "–" : `${grade.percent.toFixed(1)}%`}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Weight graded</p>
          <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
            {grade.gradedWeight} of {grade.totalWeight}
          </p>
        </div>
        {grade.passing !== null && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className={cn("mt-1 font-heading text-3xl font-semibold", grade.passing === false && "text-destructive")}>
              {grade.passing ? "Passing" : "Not passing"}
            </p>
          </div>
        )}
        <p className="w-full text-sm text-muted-foreground">
          Using {scale.name}.{" "}
          {editable && (
            <Link href="/settings" className="underline">
              Change grading scales
            </Link>
          )}
        </p>
      </div>

      {categories.length > 0 && grade.totalWeight !== 100 && (
        <p
          role="status"
          className="mb-6 flex items-start gap-2.5 rounded-lg bg-highlight/50 px-4 py-3 text-sm text-highlight-foreground dark:bg-highlight"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Your category weights add up to {grade.totalWeight}, not 100. Check your syllabus so this grade is accurate.
        </p>
      )}

      {categories.length === 0 && (
        <p className="mb-6 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No grades for this subject yet. Add a category, such as Quizzes, to get started.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            allCategories={categoryOptions}
            basePercent={scale.basePercent}
            editable={editable}
          />
        ))}
      </div>
    </>
  );
}
