"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleCalendarApi } from "@/lib/google/calendar";
import { RECONNECT, syncCalendar } from "@/lib/google/sync";
import {
  authorizationUrl,
  CALLBACK_PATH,
  deleteConnection,
  isGoogleCalendarConfigured,
  loadConnection,
  newAuthorizationRequest,
  refreshAccessToken,
  revokeToken,
  STATE_COOKIE,
} from "@/lib/google/tokens";
import { createClient, signedInClient } from "@/lib/supabase/server";
import { SIGNED_OUT_MESSAGE, type ActionResult } from "@/lib/validation/subjects";

const NOT_SET_UP = "Google Calendar isn't set up on this copy of the app.";

/** Sends the student to Google to allow Calendar access. Google sends them back to the callback route. */
export async function connectGoogleCalendar() {
  if (!isGoogleCalendarConfigured) redirect("/settings?google=not-set-up#google");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/settings");

  const origin = (await headers()).get("origin");
  const { state, verifier, challenge } = newAuthorizationRequest();

  // Ten minutes to finish on Google's page. The cookie is only sent back to the callback.
  (await cookies()).set(STATE_COOKIE, `${state}.${verifier}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: CALLBACK_PATH,
    maxAge: 600,
  });

  redirect(
    authorizationUrl({
      redirectUri: `${origin}${CALLBACK_PATH}`,
      state,
      challenge,
      loginHint: typeof data.claims.email === "string" ? data.claims.email : undefined,
    }),
  );
}

export async function syncGoogleCalendarNow(): Promise<ActionResult> {
  if (!isGoogleCalendarConfigured) return { ok: false, message: NOT_SET_UP };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  const result = await syncCalendar(session.supabase, session.userId);
  revalidatePath("/settings");

  if (result.status === "not-connected") return { ok: false, message: "Google Calendar isn't connected." };
  if (result.status === "error") {
    return {
      ok: false,
      message: result.message === RECONNECT ? "Google needs you to connect again." : result.message,
    };
  }
  return {
    ok: true,
    message: result.changes === 0 ? "Google Calendar is already up to date." : "Synced with Google Calendar.",
  };
}

/** Stops syncing, removes the app's access in Google and, if asked, the calendar it made. */
export async function disconnectGoogleCalendar(removeCalendar: boolean): Promise<ActionResult> {
  if (!isGoogleCalendarConfigured) return { ok: false, message: NOT_SET_UP };

  const session = await signedInClient();
  if (!session) return { ok: false, message: SIGNED_OUT_MESSAGE };

  let connection;
  try {
    connection = await loadConnection(session.userId);
  } catch {
    // The stored token can't be read, so there's nothing to revoke. Just forget it.
    connection = null;
  }

  let calendarKept = false;
  if (connection) {
    if (removeCalendar && connection.calendarId) {
      try {
        const api = new GoogleCalendarApi(await refreshAccessToken(connection.refreshToken));
        await api.deleteCalendar(connection.calendarId);
      } catch (error) {
        console.error("Couldn't remove the Google calendar", error);
        calendarKept = true;
      }
    }
    await revokeToken(connection.refreshToken);
  }

  try {
    await deleteConnection(session.userId);
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Couldn't disconnect Google Calendar. Please try again." };
  }

  revalidatePath("/settings");
  return {
    ok: true,
    message: calendarKept
      ? "Disconnected. The OLARound calendar couldn't be removed, so delete it in Google Calendar."
      : "Disconnected Google Calendar.",
  };
}
