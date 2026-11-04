"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import listPlugin from "@fullcalendar/react/list";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import "temporal-polyfill/global";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import { classMeetings, DEMO_TODAY, events, getSubject, term } from "@/lib/mock-data";

function colorsFor(subjectId?: string) {
  const color = (subjectId && getSubject(subjectId)?.color) || "#6b7280";
  return {
    // Darkened so white event text stays readable on every subject color.
    color: `color-mix(in oklch, ${color} 82%, black)`,
    contrastColor: "#ffffff",
  };
}

// Anything tied to a subject opens that subject's quiz cards.
function linkFor(subjectId?: string) {
  return subjectId ? { url: `/decks?subject=${subjectId}` } : {};
}

const calendarEvents = [
  ...classMeetings.map((meeting) => ({
    id: meeting.id,
    title: getSubject(meeting.subjectId)?.name ?? "Class",
    daysOfWeek: [meeting.dayOfWeek],
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    startRecur: term.startDate,
    endRecur: term.endDate,
    ...colorsFor(meeting.subjectId),
    ...linkFor(meeting.subjectId),
  })),
  ...events.map((event) => ({
    id: event.id,
    title: event.type === "exam" ? `Exam: ${event.title}` : `Due: ${event.title}`,
    start: event.startsAt,
    ...colorsFor(event.subjectId),
    ...linkFor(event.subjectId),
  })),
];

export function ScheduleCalendar() {
  const router = useRouter();
  const isNarrow = window.innerWidth < 768;
  const firstView = isNarrow ? "listWeek" : "timeGridWeek";
  const shown = useRef<{ view: string; date: Date | string }>({ view: firstView, date: DEMO_TODAY });
  const [instance, setInstance] = useState({ key: 0, view: firstView, date: DEMO_TODAY as Date | string });

  // Next.js hides pages with display: none when you leave them, and FullCalendar measures its
  // grid wrong while hidden. Rebuilding it for the next visit keeps the layout correct, and
  // passing the last view and date back in means you return to what you were looking at.
  useLayoutEffect(() => {
    return () => {
      const { view, date } = shown.current;
      setInstance((previous) => ({ key: previous.key + 1, view, date }));
    };
  }, []);

  return (
    <div className="schedule-calendar">
      <FullCalendar
        key={instance.key}
        plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView={instance.view}
        initialDate={instance.date}
        now={DEMO_TODAY}
        headerToolbar={
          isNarrow
            ? { start: "prev,next", center: "title", end: "listWeek,dayGridMonth" }
            : { start: "prev,next today", center: "title", end: "timeGridWeek,dayGridMonth,listWeek" }
        }
        buttons={{
          today: { text: "Today" },
          timeGridWeek: { text: "Week" },
          dayGridMonth: { text: "Month" },
          listWeek: { text: "List" },
        }}
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        height="auto"
        firstDay={1}
        listItemEventTitleClass="schedule-list-title"
        events={calendarEvents}
        datesSet={(info) => {
          shown.current = { view: info.view.type, date: info.view.currentStart };
        }}
        eventClick={(info) => {
          if (!info.event.url) return;
          // Stay inside the app instead of doing a full page load.
          info.jsEvent.preventDefault();
          router.push(info.event.url);
        }}
      />
    </div>
  );
}
