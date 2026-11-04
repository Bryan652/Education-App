"use client";

import { useEffect } from "react";
import { saveDetectedTimezone } from "@/actions/settings";

// Only the browser knows the student's time zone, so it reports it the first time they visit.
export function TimezoneSync() {
  useEffect(() => {
    void saveDetectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return null;
}
