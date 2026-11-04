import { Pencil } from "lucide-react";
import {
  DeleteEventButton,
  EventDoneCheckbox,
  EventFormDialog,
} from "@/components/schedule/schedule-dialogs";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import type { EventRecord, ScheduleSubject } from "@/lib/schedule/calendar";
import { cn, formatClock, relativeDay } from "@/lib/utils";

function whenText(event: EventRecord, today: string) {
  const day = relativeDay(today, event.startsAt);
  return event.allDay ? day : `${day}, ${formatClock(event.startsAt.slice(11, 16))}`;
}

function EventRows({
  events,
  subjects,
  today,
  editable,
}: {
  events: EventRecord[];
  subjects: ScheduleSubject[];
  today: string;
  editable: boolean;
}) {
  const options = subjects.filter((subject) => !subject.archivedAt).map(({ id, name }) => ({ id, name }));

  return (
    <ul className="flex flex-col">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-3 border-b py-2.5 last:border-0">
          {editable && <EventDoneCheckbox event={event} />}
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-medium", event.completedAt && "text-muted-foreground line-through")}>
              {event.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <SubjectBadge subject={subjects.find((subject) => subject.id === event.subjectId)} />
              <span className="text-xs text-muted-foreground">{whenText(event, today)}</span>
            </div>
          </div>
          {editable && (
            <>
              <EventFormDialog
                event={event}
                subjects={options}
                today={today}
                triggerProps={{ variant: "ghost", size: "icon-lg", className: "", "aria-label": `Edit ${event.title}` }}
                trigger={<Pencil aria-hidden />}
              />
              <DeleteEventButton event={event} />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Selecting something on the calendar opens quiz cards, so this list is where events get edited. */
export function EventList({
  upcoming,
  others,
  subjects,
  today,
  editable,
}: {
  upcoming: EventRecord[];
  others: EventRecord[];
  subjects: ScheduleSubject[];
  today: string;
  editable: boolean;
}) {
  return (
    <section className="mt-6 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="mb-2 font-heading text-lg font-medium">Exams, deadlines and tasks</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing coming up.</p>
      ) : (
        <EventRows events={upcoming} subjects={subjects} today={today} editable={editable} />
      )}
      {others.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Past and finished ({others.length})
          </summary>
          <EventRows events={others} subjects={subjects} today={today} editable={editable} />
        </details>
      )}
    </section>
  );
}
