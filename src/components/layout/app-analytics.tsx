"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Query strings can hold what a student typed, like /notes?q=their search, so they're never sent.
function withoutQuery(event: BeforeSendEvent) {
  const url = new URL(event.url);
  url.search = "";
  return { ...event, url: url.toString() };
}

export function AppAnalytics() {
  return <Analytics beforeSend={withoutQuery} />;
}
