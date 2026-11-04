import Link from "next/link";
import { CalendarClock, Clock } from "lucide-react";
import { gradeFor, meetingSummary, upcomingEvents, DEMO_TODAY, type Subject } from "@/lib/mock-data";
import { relativeDay } from "@/lib/utils";

export function SubjectCard({ subject }: { subject: Subject }) {
  const grade = gradeFor(subject.id);
  const next = upcomingEvents(subject.id)[0];

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
            <p className="font-heading text-2xl font-semibold tabular-nums">{grade.band?.label ?? "–"}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {grade.percent === null ? "No grades" : `${grade.percent.toFixed(1)}%`}
            </p>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {meetingSummary(subject.id)}
          </p>
          <p className="flex items-center gap-2">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {next ? `${next.title} · ${relativeDay(DEMO_TODAY, next.startsAt)}` : "Nothing due soon"}
          </p>
        </div>
      </div>
    </Link>
  );
}
