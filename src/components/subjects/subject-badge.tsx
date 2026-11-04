import type { CSSProperties } from "react";
import { getSubject } from "@/lib/mock-data";

// Pages on real data pass the subject itself. Pages still on sample data only pass its ID.
export function SubjectBadge({
  subject: givenSubject,
  subjectId,
  label,
}: {
  subject?: { name: string; color: string };
  subjectId?: string;
  label?: string;
}) {
  const subject = givenSubject ?? (subjectId ? getSubject(subjectId) : undefined);
  if (!subject) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Personal
      </span>
    );
  }
  return (
    <span
      className="subject-badge inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ "--subject": subject.color } as CSSProperties}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden />
      {label ?? subject.name}
    </span>
  );
}
