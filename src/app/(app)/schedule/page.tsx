import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { PreviewButton } from "@/components/layout/preview-button";
import { EventList } from "@/components/schedule/event-list";
import { ScheduleCalendarLoader } from "@/components/schedule/schedule-calendar-loader";
import { ClassMeetingFormDialog, EventFormDialog } from "@/components/schedule/schedule-dialogs";
import { getClock } from "@/lib/data/profile";
import { getSchedule } from "@/lib/data/schedule";
import { getSubjects } from "@/lib/data/subjects";
import { buildCalendar, upcomingEvents } from "@/lib/schedule/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Schedule" };

async function ScheduleContent() {
  const [{ active, archived, terms }, { meetings, events }, { today, now }] = await Promise.all([
    getSubjects(),
    getSchedule(),
    getClock(),
  ]);
  const subjects = [...active, ...archived];
  const options = active.map(({ id, name }) => ({ id, name }));
  const calendar = buildCalendar({ meetings, events, subjects, terms });
  const currentTerm = terms.find((term) => term.startDate <= today && today <= term.endDate);

  const upcoming = upcomingEvents(events, today, subjects);
  const others = events
    .filter((event) => !upcoming.includes(event) && !archived.some((subject) => subject.id === event.subjectId))
    .reverse();

  return (
    <>
      <PageHeader
        eyebrow={currentTerm?.name}
        title="Schedule"
        actions={
          isSupabaseConfigured ? (
            <>
              {options.length > 0 && (
                <ClassMeetingFormDialog
                  subjects={options}
                  triggerProps={{ variant: "outline" }}
                  trigger={
                    <>
                      <Plus aria-hidden />
                      Add class times
                    </>
                  }
                />
              )}
              <EventFormDialog
                subjects={options}
                today={today}
                trigger={
                  <>
                    <Plus aria-hidden />
                    Add event
                  </>
                }
              />
            </>
          ) : (
            <PreviewButton size="lg">
              <Plus aria-hidden />
              Add event
            </PreviewButton>
          )
        }
      />

      {options.length === 0 && (
        <p className="mb-4 rounded-lg bg-muted px-4 py-3 text-sm">
          <Link href="/subjects" className="font-medium underline">
            Add a subject
          </Link>{" "}
          first, then you can add its class times here.
        </p>
      )}

      <p className="mb-3 text-sm text-muted-foreground">Select a class or deadline to open that subject&apos;s quiz cards.</p>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {active.map((subject) => (
          <li key={subject.id} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden />
            {subject.name}
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-5">
        <ScheduleCalendarLoader calendar={calendar} today={today} now={now} />
      </div>

      <EventList
        upcoming={upcoming}
        others={others}
        subjects={subjects}
        today={today}
        editable={isSupabaseConfigured}
      />
    </>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ScheduleContent />
    </Suspense>
  );
}
