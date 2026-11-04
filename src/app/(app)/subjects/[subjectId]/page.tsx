import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Archive, Layers, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  classMeetings,
  DEMO_TODAY,
  decks,
  dueCount,
  getSubject,
  gradeFor,
  notes,
  term,
  upcomingEvents,
} from "@/lib/mock-data";
import { cn, formatClock, relativeDay } from "@/lib/utils";

type Props = { params: Promise<{ subjectId: string }> };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: getSubject(subjectId)?.name ?? "Subject" };
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const grade = gradeFor(subject.id);
  const meetings = classMeetings.filter((meeting) => meeting.subjectId === subject.id);
  const upcoming = upcomingEvents(subject.id);
  const subjectNotes = notes.filter((note) => note.subjectId === subject.id);
  const subjectDecks = decks.filter((deck) => deck.subjectId === subject.id);

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden />
            {subject.code} · {term.name}
          </span>
        }
        title={subject.name}
        description={`${subject.instructor} · ${subject.units} units`}
        actions={
          <PreviewButton variant="outline" size="lg" message="This is a preview, so subjects can't be archived yet.">
            <Archive aria-hidden />
            Archive
          </PreviewButton>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Link
          href={`/subjects/${subject.id}/grades`}
          className="group flex flex-col justify-between gap-6 rounded-xl p-5 text-primary-foreground transition-shadow hover:shadow-md"
          style={{ backgroundColor: `color-mix(in oklch, ${subject.color} 80%, black)` }}
        >
          <p className="font-heading text-lg font-medium">Current grade</p>
          <div>
            <p className="font-heading text-6xl font-semibold tabular-nums">{grade.band?.label ?? "–"}</p>
            <p className="mt-1 flex items-center justify-between text-sm tabular-nums">
              {grade.percent?.toFixed(1)}%
              <span className="flex items-center gap-1 font-medium group-hover:underline">
                View grades
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </p>
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class times</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {meetings.map((meeting) => (
                <li key={meeting.id} className="text-sm">
                  <p className="font-medium">{DAYS[meeting.dayOfWeek]}</p>
                  <p className="text-muted-foreground">
                    {formatClock(meeting.startTime)} – {formatClock(meeting.endTime)} · {meeting.location}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coming up</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is due soon.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{event.title}</span>
                    <span className="shrink-0 text-muted-foreground">{relativeDay(DEMO_TODAY, event.startsAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {subjectNotes.map((note) => (
                <li key={note.id} className="border-b last:border-0">
                  <Link href={`/notes/${note.id}`} className="group flex items-center gap-3 py-3">
                    <NotebookPen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="flex-1 text-sm font-medium group-hover:underline">{note.title}</span>
                    <span className="text-sm text-muted-foreground">{relativeDay(DEMO_TODAY, note.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quiz cards</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectDecks.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">No decks for this subject yet.</p>
                <Link href="/decks" className={cn(buttonVariants({ variant: "outline" }))}>
                  Go to quiz cards
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {subjectDecks.map((deck) => (
                  <li key={deck.id}>
                    <Link href={`/decks/${deck.id}`} className="group flex items-center gap-3 text-sm">
                      <Layers className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="flex-1 font-medium group-hover:underline">{deck.name}</span>
                      <span className="text-muted-foreground">{dueCount(deck)} due</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
