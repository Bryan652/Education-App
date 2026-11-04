import Link from "next/link";
import { CalendarClock, Clock } from "lucide-react";
import type { GradeResult } from "@/lib/grades/compute";
import type { Subject } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function SubjectCard({
  subject,
  grade,
  meetingText,
  nextText,
}: {
  subject: Subject;
  grade: GradeResult | undefined;
  meetingText: string;
  nextText: string;
}) {
  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="h-1.5" style={{ backgroundColor: subject.color }} aria-hidden />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">{subject.code}</p>
            <h2 className="mt-1 font-heading text-xl font-semibold group-hover:underline">{subject.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{subject.instructor}</p>
          </div>
          <div className="text-right">
            <p className={cn("font-heading text-2xl font-semibold tabular-nums", grade?.passing === false && "text-destructive")}>
              {grade?.label ?? "–"}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {grade?.percent == null ? "No grades" : `${grade.percent.toFixed(1)}%`}
            </p>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {meetingText}
          </p>
          <p className="flex items-center gap-2">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {nextText}
          </p>
        </div>
      </div>
    </Link>
  );
}
