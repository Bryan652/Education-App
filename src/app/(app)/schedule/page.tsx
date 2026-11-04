import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { ScheduleCalendarLoader } from "@/components/schedule/schedule-calendar-loader";
import { subjects, term } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <>
      <PageHeader
        eyebrow={term.name}
        title="Schedule"
        actions={
          <PreviewButton size="lg">
            <Plus aria-hidden />
            Add event
          </PreviewButton>
        }
      />
      <p className="mb-3 text-sm text-muted-foreground">Select a class or deadline to open that subject&apos;s quiz cards.</p>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {subjects.map((subject) => (
          <li key={subject.id} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden />
            {subject.name}
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-5">
        <ScheduleCalendarLoader />
      </div>
    </>
  );
}
