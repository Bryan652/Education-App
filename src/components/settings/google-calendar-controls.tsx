"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { connectGoogleCalendar, disconnectGoogleCalendar, syncGoogleCalendarNow } from "@/actions/google";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// What the callback route reports back, as ?google= on the Settings address.
const OUTCOMES: Record<string, string> = {
  connected: "Connected Google Calendar. Your classes and deadlines are in the Education App calendar.",
  "connected-sync-failed": "Connected Google Calendar, but the first sync didn't finish. Try Sync now.",
  cancelled: "Google Calendar wasn't connected.",
  "missing-permission": "Google Calendar needs the calendar permission ticked. Please connect again.",
  "not-set-up": "Google Calendar isn't set up on this copy of the app.",
  failed: "Couldn't connect Google Calendar. Please try again.",
};

/** Shows the result of connecting once, then tidies the address so a reload doesn't repeat it. */
export function GoogleOutcomeNotice() {
  const outcome = useSearchParams().get("google");

  useEffect(() => {
    if (!outcome) return;
    toast(OUTCOMES[outcome] ?? OUTCOMES.failed);
    const url = new URL(window.location.href);
    url.searchParams.delete("google");
    window.history.replaceState(window.history.state, "", url);
  }, [outcome]);

  return null;
}

function ConnectButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" className="px-3" disabled={pending}>
      {pending ? "Opening Google…" : label}
    </Button>
  );
}

function DisconnectDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Ticked by default, because a calendar that stops updating would quietly go out of date.
  const [removeCalendar, setRemoveCalendar] = useState(true);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" size="lg" className="px-3 text-destructive hover:text-destructive" />}>
        Disconnect
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
          <AlertDialogDescription>
            The app stops syncing and gives up its access to your Google account. Your schedule in the app stays as it
            is.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-start gap-2 px-4 pb-4 text-sm">
          <input
            type="checkbox"
            checked={removeCalendar}
            onChange={(event) => setRemoveCalendar(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          Also remove the Education App calendar from Google Calendar
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" className="px-3" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="lg"
            className="px-3"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await disconnectGoogleCalendar(removeCalendar);
                toast(result.message);
                if (result.ok) setOpen(false);
              })
            }
          >
            {pending ? "Disconnecting…" : "Disconnect"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function GoogleCalendarControls({ connected, needsReconnect }: { connected: boolean; needsReconnect: boolean }) {
  const [syncing, startSync] = useTransition();

  if (!connected || needsReconnect) {
    return (
      <div className="flex items-center gap-1">
        <form action={connectGoogleCalendar}>
          <ConnectButton label={needsReconnect ? "Connect again" : "Connect"} />
        </form>
        {needsReconnect && <DisconnectDialog />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="lg"
        className="px-3"
        disabled={syncing}
        onClick={() =>
          startSync(async () => {
            const result = await syncGoogleCalendarNow();
            toast(result.message);
          })
        }
      >
        <RefreshCw className={syncing ? "animate-spin" : undefined} aria-hidden />
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
      <DisconnectDialog />
    </div>
  );
}
