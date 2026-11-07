import type { ReactNode } from "react";
import { connection } from "next/server";
import { CalendarDays, LogIn } from "lucide-react";
import { GoogleCalendarControls } from "@/components/settings/google-calendar-controls";
import { PreviewButton } from "@/components/layout/preview-button";
import { getProfile } from "@/lib/data/profile";
import { RECONNECT } from "@/lib/google/sync";
import { isGoogleCalendarConfigured, loadConnectionStatus } from "@/lib/google/tokens";
import { utcToLocal } from "@/lib/schedule/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signedInClient } from "@/lib/supabase/server";
import { formatClock, formatDate } from "@/lib/utils";

function Row({ icon: Icon, name, description, children }: {
  icon: typeof LogIn;
  name: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b py-3 first:pt-0 last:border-0 last:pb-0">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      {children}
    </li>
  );
}

async function calendarStatus() {
  if (!isGoogleCalendarConfigured) return null;
  await connection();
  const session = await signedInClient();
  if (!session) return null;

  const [status, { timezone }] = await Promise.all([loadConnectionStatus(session.userId), getProfile()]);
  if (!status) return { connected: false as const };

  const synced = status.last_synced_at ? utcToLocal(status.last_synced_at, timezone) : null;
  return {
    connected: true as const,
    email: status.google_email,
    lastSynced: synced
      ? `${formatDate(synced, { month: "short", day: "numeric" })}, ${formatClock(synced.slice(11, 16))}`
      : null,
    needsReconnect: status.sync_error === RECONNECT,
    error: status.sync_error === RECONNECT ? null : status.sync_error,
  };
}

/** Sign-in and Calendar are the only Google services the app uses, so each asks for as little as it can. */
export async function GoogleSection() {
  const calendar = isSupabaseConfigured ? await calendarStatus() : null;

  let calendarDescription: ReactNode = "Adds your classes, exams and deadlines to a calendar of their own";
  if (calendar?.connected) {
    calendarDescription = calendar.needsReconnect ? (
      <span className="text-destructive">Google stopped accepting the connection. Connect again to keep syncing.</span>
    ) : (
      <>
        <span className="block">
          Syncing to the Education App calendar{calendar.email ? ` in ${calendar.email}` : ""}.
        </span>
        {calendar.error ? (
          <span className="block text-destructive">{calendar.error}</span>
        ) : (
          calendar.lastSynced && <span className="block">Last synced {calendar.lastSynced}.</span>
        )}
      </>
    );
  } else if (isSupabaseConfigured && !isGoogleCalendarConfigured) {
    calendarDescription = "Not set up on this copy of the app. The README explains how.";
  }

  return (
    <ul className="flex flex-col">
      <Row icon={LogIn} name="Google sign-in" description="Sign in to the app">
        <span className="text-sm text-muted-foreground">{isSupabaseConfigured ? "Connected" : "Sample"}</span>
      </Row>
      <Row icon={CalendarDays} name="Google Calendar" description={calendarDescription}>
        {!isSupabaseConfigured ? (
          <PreviewButton variant="outline" size="lg" message="This is a preview, so Google isn't connected yet.">
            Connect
          </PreviewButton>
        ) : (
          calendar && (
            <GoogleCalendarControls
              connected={calendar.connected}
              needsReconnect={calendar.connected && calendar.needsReconnect}
            />
          )
        )}
      </Row>
    </ul>
  );
}
