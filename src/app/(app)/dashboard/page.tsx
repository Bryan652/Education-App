import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEMO_TODAY,
  gradeFor,
  getSubject,
  notes,
  profile,
  subjects,
  todayAgenda,
  totalDue,
  upcomingEvents,
} from "@/lib/mock-data";
import { cn, formatClock, formatDate, relativeDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const agenda = todayAgenda();
  const classCount = agenda.filter((item) => item.kind === "class").length;
  const dueCount = agenda.length - classCount;
  const nextUp = upcomingEvents()
    .filter((event) => event.startsAt.slice(0, 10) > DEMO_TODAY)
    .slice(0, 4);
  const recentNotes = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={formatDate(DEMO_TODAY, { weekday: "long", month: "long", day: "numeric" })}
        title={`Welcome back, ${profile.firstName}`}
        description={`You have ${classCount} classes and ${dueCount} deadline today.`}
      />

      {/* Two independent columns on desktop. On phones the cards stack using their order values. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-5">
          <Card className="order-1 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col">
                {agenda.map((item) => {
                  const subject = item.subjectId ? getSubject(item.subjectId) : undefined;
                  return (
                    <li key={item.id} className="flex gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0">
                      <time className="w-16 shrink-0 pt-0.5 text-sm text-muted-foreground tabular-nums">
                        {formatClock(item.time)}
                      </time>
                      <span
                        className="w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: subject?.color ?? "var(--border)" }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                      {item.kind !== "class" && (
                        <span className="h-fit rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-highlight-foreground">
                          Due today
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card className="order-4 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Grades so far</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {subjects.map((subject) => {
                  const grade = gradeFor(subject.id);
                  return (
                    <li key={subject.id}>
                      <Link href={`/subjects/${subject.id}/grades`} className="group block">
                        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium group-hover:underline">{subject.name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {grade.percent?.toFixed(1)}% · {grade.band?.label}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${grade.percent ?? 0}%`, backgroundColor: subject.color }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <Card className="order-2 bg-primary text-primary-foreground ring-0 lg:order-none">
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="font-heading text-lg font-medium">Cards to review</p>
                <Layers className="size-5 text-highlight" aria-hidden />
              </div>
              <p className="font-heading text-6xl font-semibold text-highlight tabular-nums">{totalDue}</p>
              <Link
                href="/decks"
                className={cn(buttonVariants({ variant: "secondary" }), "h-9 w-full bg-card hover:bg-card/90")}
              >
                Start studying
                <ArrowRight aria-hidden />
              </Link>
            </CardContent>
          </Card>

          <Card className="order-3 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Coming up</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3.5">
                {nextUp.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <div className="mt-1">
                        <SubjectBadge subjectId={event.subjectId} />
                      </div>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">{relativeDay(DEMO_TODAY, event.startsAt)}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="order-5 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Recent notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3.5">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link href={`/notes/${note.id}`} className="group block">
                      <p className="text-sm font-medium group-hover:underline">{note.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <SubjectBadge subjectId={note.subjectId} />
                        <span className="text-xs text-muted-foreground">{relativeDay(DEMO_TODAY, note.updatedAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
