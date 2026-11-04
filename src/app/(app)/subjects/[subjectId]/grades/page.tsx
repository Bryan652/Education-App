import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { CategoryCard } from "@/components/grades/category-card";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { categoriesFor, getSubject, gradeFor } from "@/lib/mock-data";

type Props = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: `${getSubject(subjectId)?.name ?? "Subject"} grades` };
}

export default async function SubjectGradesPage({ params }: Props) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const grade = gradeFor(subject.id);
  const categories = categoriesFor(subject.id);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/subjects/${subject.id}`} className="hover:underline">
            ← {subject.name}
          </Link>
        }
        title="Grades"
        actions={
          <>
            <PreviewButton variant="outline" size="lg">Add category</PreviewButton>
            <PreviewButton size="lg">Add score</PreviewButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-10 gap-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current grade</p>
          <p className="mt-1 font-heading text-6xl font-semibold" style={{ color: subject.color }}>
            {grade.band?.label ?? "–"}
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
      </div>

      {grade.totalWeight !== 100 && (
        <p
          role="status"
          className="mb-6 flex items-start gap-2.5 rounded-lg bg-highlight/50 px-4 py-3 text-sm text-highlight-foreground"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Your category weights add up to {grade.totalWeight}, not 100. Check your syllabus so this grade is accurate.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </>
  );
}
