import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDecks } from "@/lib/data/cards";
import { getGradesBySubject } from "@/lib/data/grades";
import { getNotes } from "@/lib/data/notes";
import { getClock, getProfile } from "@/lib/data/profile";
import { getSchedule } from "@/lib/data/schedule";
import { getSubjects } from "@/lib/data/subjects";
import { todayAgenda, upcomingEvents } from "@/lib/schedule/calendar";
import { cn, formatClock, formatDate, relativeDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardContent() {
  const [profile, { active, archived, terms }, { meetings, events }, { today }, recentNotes, decks] = await Promise.all([
    getProfile(),
    getSubjects(),
    getSchedule(),
    getClock(),
    getNotes({ limit: 3 }),
    getDecks(),
  ]);
  const grades = await getGradesBySubject(active);

  const subjects = [...active, ...archived];
  const subjectOf = (id: string | null | undefined) => subjects.find((subject) => subject.id === id);

  const agenda = todayAgenda({ today, meetings, events, subjects, terms });
  const classCount = agenda.filter((item) => item.isClass).length;
  const dueToday = agenda.length - classCount;
  const nextUp = upcomingEvents(events, today, subjects)
    .filter((event) => event.startsAt.slice(0, 10) > today)
    .slice(0, 4);
  // Decks for archived subjects are hidden, so they don't count as cards to review.
  const totalDue = decks
    .filter((deck) => active.some((subject) => subject.id === deck.subjectId))
    .reduce((sum, deck) => sum + deck.dueCount, 0);
  const gradedSubjects = active.filter((subject) => grades.get(subject.id)?.grade.percent !== null);

  return (
    <>
      <PageHeader
        eyebrow={formatDate(today, { weekday: "long", month: "long", day: "numeric" })}
        title={profile.firstName ? `Welcome back, ${profile.firstName}` : "Welcome back"}
        description={`You have ${classCount} ${classCount === 1 ? "class" : "classes"} and ${dueToday} ${dueToday === 1 ? "deadline" : "deadlines"} today.`}
      />

      {/* Two independent columns on desktop. On phones the cards stack using their order values. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-5">
          <Card className="order-1 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Today</CardTitle>
            </CardHeader>
            <CardContent>
              {agenda.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled today.</p>
              ) : (
                <ol className="flex flex-col">
                  {agenda.map((item) => (
                    <li key={item.id} className="flex gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0">
                      <time className="w-16 shrink-0 pt-0.5 text-sm text-muted-foreground tabular-nums">
                        {item.time ? formatClock(item.time) : "All day"}
                      </time>
                      <span
                        className="w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: subjectOf(item.subjectId)?.color ?? "var(--border)" }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                      {!item.isClass && (
                        <span className="h-fit rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-highlight-foreground">
                          Due today
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="order-4 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Grades so far</CardTitle>
            </CardHeader>
            <CardContent>
              {gradedSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Grades appear here once you add scores to a{" "}
                  <Link href="/subjects" className="underline">
                    subject
                  </Link>
                  .
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {gradedSubjects.map((subject) => {
                    const grade = grades.get(subject.id)?.grade;
                    return (
                      <li key={subject.id}>
                        <Link href={`/subjects/${subject.id}/grades`} className="group block">
                          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-medium group-hover:underline">{subject.name}</span>
                            <span
                              className={cn(
                                "text-muted-foreground tabular-nums",
                                grade?.passing === false && "font-medium text-destructive",
                              )}
                            >
                              {grade?.percent?.toFixed(1)}% · {grade?.label}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              // Extra credit can go past 100%, but the bar can't.
                              style={{ width: `${Math.min(grade?.percent ?? 0, 100)}%`, backgroundColor: subject.color }}
                            />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
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
              {nextUp.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing coming up.</p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {nextUp.map((event) => (
                    <li key={event.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="mt-1">
                          <SubjectBadge subject={subjectOf(event.subjectId)} />
                        </div>
                      </div>
                      <p className="shrink-0 text-sm text-muted-foreground">{relativeDay(today, event.startsAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="order-5 lg:order-none">
            <CardHeader>
              <CardTitle className="text-lg">Recent notes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {recentNotes.map((note) => (
                    <li key={note.id}>
                      <Link href={`/notes/${note.id}`} className="group block">
                        <p className="text-sm font-medium group-hover:underline">{note.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <SubjectBadge subject={subjectOf(note.subjectId)} />
                          <span className="text-xs text-muted-foreground">{relativeDay(today, note.updatedAt)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
