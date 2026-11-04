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
import type { buildCalendar } from "@/lib/schedule/calendar";

// Every time here is already on the student's own clock, so the calendar shows them as written,
// whatever time zone the browser is in.
export function ScheduleCalendar({
  calendar,
  today,
  now,
}: {
  calendar: ReturnType<typeof buildCalendar>;
  today: string;
  now: string;
}) {
  const router = useRouter();
  const isNarrow = window.innerWidth < 768;
  const firstView = isNarrow ? "listWeek" : "timeGridWeek";
  const shown = useRef<{ view: string; date: Date | string }>({ view: firstView, date: today });
  const [instance, setInstance] = useState({ key: 0, view: firstView, date: today as Date | string });

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
        now={now}
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
        allDaySlot={calendar.hasAllDayEvents}
        slotMinTime={calendar.slotMinTime}
        slotMaxTime={calendar.slotMaxTime}
        height="auto"
        firstDay={1}
        listItemEventTitleClass="schedule-list-title"
        events={calendar.calendarEvents}
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
