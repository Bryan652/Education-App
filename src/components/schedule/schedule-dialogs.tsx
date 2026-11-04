"use client";

import { useOptimistic, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createClassMeetings,
  createEvent,
  deleteClassMeeting,
  deleteEvent,
  setEventCompleted,
  updateClassMeeting,
  updateEvent,
} from "@/actions/schedule";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { FormDialog } from "@/components/layout/form-dialog";
import { FieldError, fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import type { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassMeetingRecord, EventRecord } from "@/lib/schedule/calendar";
import { byWeekOrder, DAY_NAMES, SHORT_DAY_NAMES } from "@/lib/schedule/time";
import { EVENT_TYPES } from "@/lib/validation/schedule";

interface SubjectOption {
  id: string;
  name: string;
}

// The order students read a week in, starting from Monday.
const WEEK = byWeekOrder(DAY_NAMES.map((_, dayOfWeek) => ({ dayOfWeek, startTime: "" })));

function DayPicker({ errors }: { errors?: string[] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Days</legend>
      <div className="flex flex-wrap gap-2">
        {WEEK.map(({ dayOfWeek }) => (
          <label key={dayOfWeek} className="cursor-pointer" title={DAY_NAMES[dayOfWeek]}>
            <input type="checkbox" name="days" value={dayOfWeek} className="peer sr-only" />
            <span className="block rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
              <span className="sr-only">{DAY_NAMES[dayOfWeek]}</span>
              <span aria-hidden>{SHORT_DAY_NAMES[dayOfWeek]}</span>
            </span>
          </label>
        ))}
      </div>
      <FieldError id="meeting-days-error" errors={errors} />
    </fieldset>
  );
}

/** Adding can cover several days at once. Editing changes one class time, so it picks one day. */
export function ClassMeetingFormDialog({
  subjects,
  subjectId,
  meeting,
  triggerProps,
  trigger,
}: {
  subjects: SubjectOption[];
  subjectId?: string;
  meeting?: ClassMeetingRecord;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  const fixedSubject = subjectId ?? meeting?.subjectId;

  return (
    <FormDialog
      title={meeting ? "Edit class time" : "Add class times"}
      description="Classes repeat every week until the end of their term."
      submitLabel={meeting ? "Save changes" : "Add class times"}
      action={(formData) => (meeting ? updateClassMeeting(meeting.id, formData) : createClassMeetings(formData))}
      triggerProps={triggerProps}
      trigger={trigger}
    >
      {(errors) => (
        <>
          {fixedSubject ? (
            <input type="hidden" name="subject_id" value={fixedSubject} />
          ) : (
            <FormField id="meeting-subject" label="Subject" errors={errors.subject_id}>
              <NativeSelect id="meeting-subject" name="subject_id" {...fieldA11y("meeting-subject", errors.subject_id)}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          )}

          {meeting ? (
            <FormField id="meeting-day" label="Day" errors={errors.days}>
              <NativeSelect id="meeting-day" name="days" defaultValue={meeting.dayOfWeek}>
                {WEEK.map(({ dayOfWeek }) => (
                  <option key={dayOfWeek} value={dayOfWeek}>
                    {DAY_NAMES[dayOfWeek]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : (
            <DayPicker errors={errors.days} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField id="meeting-start" label="Starts" errors={errors.start_time}>
              <Input
                id="meeting-start"
                name="start_time"
                type="time"
                defaultValue={meeting?.startTime}
                required
                className="h-10"
                {...fieldA11y("meeting-start", errors.start_time)}
              />
            </FormField>
            <FormField id="meeting-end" label="Ends" errors={errors.end_time}>
              <Input
                id="meeting-end"
                name="end_time"
                type="time"
                defaultValue={meeting?.endTime}
                required
                className="h-10"
                {...fieldA11y("meeting-end", errors.end_time)}
              />
            </FormField>
          </div>

          <FormField id="meeting-location" label="Location" optional errors={errors.location}>
            <Input
              id="meeting-location"
              name="location"
              defaultValue={meeting?.location}
              maxLength={100}
              placeholder="Science 204"
              className="h-10"
              {...fieldA11y("meeting-location", errors.location)}
            />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteClassMeetingButton({ meeting, label }: { meeting: ClassMeetingRecord; label: string }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${label}`}
      title="Delete this class time?"
      description={`${label} will no longer repeat on your schedule.`}
      action={() => deleteClassMeeting(meeting.id)}
    />
  );
}

function EventFields({
  event,
  subjects,
  subjectId,
  today,
  errors,
}: {
  event?: EventRecord;
  subjects: SubjectOption[];
  subjectId?: string;
  today: string;
  errors: Record<string, string[] | undefined>;
}) {
  const [allDay, setAllDay] = useState(event?.allDay ?? false);

  return (
    <>
      <FormField id="event-title" label="Title" errors={errors.title}>
        <Input
          id="event-title"
          name="title"
          defaultValue={event?.title}
          maxLength={200}
          required
          autoFocus
          placeholder="Lab report 3"
          className="h-10"
          {...fieldA11y("event-title", errors.title)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="event-type" label="Type" errors={errors.type}>
          <NativeSelect
            id="event-type"
            name="type"
            defaultValue={event?.type ?? "assignment"}
            {...fieldA11y("event-type", errors.type)}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="event-subject" label="Subject" optional errors={errors.subject_id}>
          <NativeSelect
            id="event-subject"
            name="subject_id"
            defaultValue={event ? (event.subjectId ?? "") : (subjectId ?? "")}
            {...fieldA11y("event-subject", errors.subject_id)}
          >
            <option value="">Personal</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField id="event-date" label="Date" errors={errors.date}>
        <Input
          id="event-date"
          name="date"
          type="date"
          defaultValue={event?.startsAt.slice(0, 10) ?? today}
          required
          className="h-10"
          {...fieldA11y("event-date", errors.date)}
        />
      </FormField>

      <div className="flex items-center gap-2">
        <input
          id="event-all-day"
          name="all_day"
          type="checkbox"
          checked={allDay}
          onChange={(change) => setAllDay(change.target.checked)}
          className="size-4 accent-primary"
        />
        <Label htmlFor="event-all-day">All day</Label>
      </div>

      {!allDay && (
        <div className="grid grid-cols-2 gap-4">
          <FormField id="event-start" label="Time" errors={errors.start_time}>
            <Input
              id="event-start"
              name="start_time"
              type="time"
              defaultValue={event && !event.allDay ? event.startsAt.slice(11, 16) : undefined}
              required
              className="h-10"
              {...fieldA11y("event-start", errors.start_time)}
            />
          </FormField>
          <FormField id="event-end" label="Ends" optional errors={errors.end_time}>
            <Input
              id="event-end"
              name="end_time"
              type="time"
              defaultValue={event?.endsAt?.slice(11, 16)}
              className="h-10"
              {...fieldA11y("event-end", errors.end_time)}
            />
          </FormField>
        </div>
      )}
    </>
  );
}

export function EventFormDialog({
  event,
  subjects,
  subjectId,
  today,
  triggerProps,
  trigger,
}: {
  event?: EventRecord;
  subjects: SubjectOption[];
  subjectId?: string;
  today: string;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={event ? "Edit event" : "Add an event"}
      description="Exams, deadlines and tasks. Linking one to a subject lets you jump to its quiz cards."
      submitLabel={event ? "Save changes" : "Add event"}
      action={(formData) => (event ? updateEvent(event.id, formData) : createEvent(formData))}
      triggerProps={triggerProps}
      trigger={trigger}
    >
      {(errors) => <EventFields event={event} subjects={subjects} subjectId={subjectId} today={today} errors={errors} />}
    </FormDialog>
  );
}

export function DeleteEventButton({ event }: { event: EventRecord }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${event.title}`}
      title={`Delete ${event.title}?`}
      description="This can't be undone."
      action={() => deleteEvent(event.id)}
    />
  );
}

export function EventDoneCheckbox({ event }: { event: EventRecord }) {
  const [pending, startTransition] = useTransition();
  const done = Boolean(event.completedAt);
  // Ticks straight away, rather than looking like the click did nothing until the server answers.
  const [shownDone, setShownDone] = useOptimistic(done);

  return (
    <input
      type="checkbox"
      aria-label={done ? `Mark ${event.title} as not finished` : `Mark ${event.title} as finished`}
      checked={shownDone}
      disabled={pending}
      onChange={() =>
        startTransition(async () => {
          setShownDone(!done);
          toast((await setEventCompleted(event.id, !done)).message);
        })
      }
      className="size-4 shrink-0 accent-primary"
    />
  );
}
