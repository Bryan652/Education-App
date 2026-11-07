import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { syncCalendar } from "@/lib/google/sync";
import {
  CALLBACK_PATH,
  exchangeCode,
  isGoogleCalendarConfigured,
  loadConnectionStatus,
  revokeToken,
  saveConnection,
  STATE_COOKIE,
} from "@/lib/google/tokens";
import { signedInClient } from "@/lib/supabase/server";

function sameText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Google sends the student back here after they allow (or refuse) Calendar access.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  function finish(outcome: string) {
    const response = NextResponse.redirect(new URL(`/settings?google=${outcome}#google`, request.url));
    response.cookies.delete({ name: STATE_COOKIE, path: CALLBACK_PATH });
    return response;
  }

  if (!isGoogleCalendarConfigured) return finish("not-set-up");

  // The state must match the cookie set when this student pressed Connect, so another site
  // can't link its own Google account to someone's app account.
  const [expectedState, verifier] = request.cookies.get(STATE_COOKIE)?.value.split(".") ?? [];
  const state = params.get("state") ?? "";
  if (!expectedState || !verifier || !sameText(state, expectedState)) return finish("failed");

  if (params.get("error")) return finish("cancelled");
  const code = params.get("code");
  if (!code) return finish("failed");

  const session = await signedInClient();
  if (!session) return NextResponse.redirect(new URL("/login?next=/settings", request.url));

  let tokens;
  try {
    tokens = await exchangeCode({ code, redirectUri: `${request.nextUrl.origin}${CALLBACK_PATH}`, verifier });
  } catch (error) {
    console.error("Couldn't finish connecting Google Calendar", error);
    return finish("failed");
  }

  if (!tokens.hasCalendar || !tokens.refreshToken) {
    // Calendar was unticked on Google's screen, so the access granted is no use. Hand it back.
    await revokeToken(tokens.refreshToken ?? tokens.accessToken);
    return finish("missing-permission");
  }

  try {
    // Reconnecting with the same Google account keeps using the calendar made last time.
    const previous = await loadConnectionStatus(session.userId);
    const sameAccount = previous && previous.google_email === tokens.email;
    await saveConnection(session.userId, {
      refreshToken: tokens.refreshToken,
      scopes: tokens.scopes,
      email: tokens.email,
      calendarId: sameAccount ? previous.calendar_id : null,
    });
  } catch (error) {
    console.error(error);
    return finish("failed");
  }

  // The first sync runs now, so Settings shows the real result when the student lands there.
  const result = await syncCalendar(session.supabase, session.userId);
  return finish(result.status === "synced" ? "connected" : "connected-sync-failed");
}
