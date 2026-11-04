import { cache } from "react";
import { connection } from "next/server";
import { getProfile } from "@/lib/data/profile";
import { classMeetings as sampleMeetings, events as sampleEvents } from "@/lib/mock-data";
import type { ClassMeetingRecord, EventRecord, EventType } from "@/lib/schedule/calendar";
import { utcToLocal } from "@/lib/schedule/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function sampleSchedule() {
  return {
    meetings: sampleMeetings as ClassMeetingRecord[],
    events: sampleEvents.map<EventRecord>((event) => ({
      ...event,
      subjectId: event.subjectId ?? null,
      endsAt: null,
      allDay: false,
      completedAt: null,
    })),
  };
}

/** Every class time and event, with event times already on the student's own clock. */
export const getSchedule = cache(async (): Promise<{ meetings: ClassMeetingRecord[]; events: EventRecord[] }> => {
  if (!isSupabaseConfigured) return sampleSchedule();

  await connection();
  const supabase = await createClient();
  const [{ timezone }, meetings, events] = await Promise.all([
    getProfile(),
    supabase.from("class_meetings").select("*").order("start_time"),
    supabase.from("events").select("*").order("starts_at"),
  ]);
  if (meetings.error) throw new Error(`Couldn't load class times: ${meetings.error.message}`);
  if (events.error) throw new Error(`Couldn't load events: ${events.error.message}`);

  return {
    meetings: meetings.data.map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      dayOfWeek: row.day_of_week,
      // Postgres returns 08:00:00. Only the hours and minutes are ever used.
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
      location: row.location ?? "",
    })),
    events: events.data.map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      title: row.title,
      type: row.type as EventType,
      // All-day events are saved as midnight UTC, so they stay on their date in every time zone.
      startsAt: utcToLocal(row.starts_at, row.all_day ? "UTC" : timezone),
      endsAt: row.ends_at ? utcToLocal(row.ends_at, timezone) : null,
      allDay: row.all_day,
      completedAt: row.completed_at,
    })),
  };
});

/** Sample subjects keep showing their sample class times and events when signed in. */
export async function getSubjectSchedule(subject: { id: string; isSample: boolean }) {
  const { meetings, events } = subject.isSample ? sampleSchedule() : await getSchedule();
  return {
    meetings: meetings.filter((meeting) => meeting.subjectId === subject.id),
    events: events.filter((event) => event.subjectId === subject.id),
  };
}
