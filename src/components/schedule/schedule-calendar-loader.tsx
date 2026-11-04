"use client";

import dynamic from "next/dynamic";

// The starting view depends on the screen width, so the calendar only renders in the browser.
export const ScheduleCalendarLoader = dynamic(
  () => import("./schedule-calendar").then((module) => module.ScheduleCalendar),
  {
    ssr: false,
    loading: () => <div className="h-[42rem] animate-pulse rounded-lg bg-muted" aria-label="Loading calendar" />,
  },
);
