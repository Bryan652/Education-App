import { getSubject } from "@/lib/mock-data";

export function SubjectBadge({ subjectId, label }: { subjectId?: string; label?: string }) {
  const subject = subjectId ? getSubject(subjectId) : undefined;
  if (!subject) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Personal
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklch, ${subject.color} 13%, white)`,
        color: `color-mix(in oklch, ${subject.color} 62%, black)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden />
      {label ?? subject.name}
    </span>
  );
}
