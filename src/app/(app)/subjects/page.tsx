import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { SubjectCard } from "@/components/subjects/subject-card";
import { currentGpa, subjects, term } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  const gpa = currentGpa();
  const units = subjects.reduce((sum, subject) => sum + subject.units, 0);

  return (
    <>
      <PageHeader
        eyebrow={term.name}
        title="Subjects"
        description={`${subjects.length} subjects · ${units} units · ${gpa?.toFixed(2)} GPA so far`}
        actions={
          <PreviewButton size="lg">
            <Plus aria-hidden />
            Add subject
          </PreviewButton>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </>
  );
}
