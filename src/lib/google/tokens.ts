import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { decryptToken, encryptToken, parseTokenKey } from "@/lib/google/crypto";
import { adminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Supabase only signs students in, and doesn't keep or refresh Google tokens. So the app asks
// Google for Calendar access itself, stores the refresh token encrypted, and gets a fresh access
// token for each sync.

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.app.created";
const SCOPES = ["openid", "email", CALENDAR_SCOPE];

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export const CALLBACK_PATH = "/api/google/callback";
export const STATE_COOKIE = "google-calendar-oauth";

const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const tokenKey = parseTokenKey(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);

/** Calendar sync is optional, so a copy of the app without these values just hides it. */
export const isGoogleCalendarConfigured = Boolean(
  isSupabaseConfigured && isAdminConfigured && clientId && clientSecret && tokenKey,
);

/** Google stopped accepting the refresh token, so the student has to connect again. */
export class ReconnectNeededError extends Error {}

function requireKey() {
  if (!tokenKey) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY isn't set to 32 base64-encoded bytes.");
  return tokenKey;
}

/** A random state, which stops another site finishing a connection for you, and a PKCE pair. */
export function newAuthorizationRequest() {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, verifier, challenge };
}

export function authorizationUrl({
  redirectUri,
  state,
  challenge,
  loginHint,
}: {
  redirectUri: string;
  state: string;
  challenge: string;
  loginHint?: string;
}) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    // offline gives a refresh token, and consent makes sure Google sends a new one every time.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `${AUTH_URL}?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...body }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (data.error === "invalid_grant") throw new ReconnectNeededError("Google no longer accepts this connection.");
  if (!response.ok) throw new Error(`Google token request failed: ${data.error ?? response.status}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
  };
}

/**
 * The ID token came straight from Google over HTTPS, in reply to the app's own request, so its
 * contents can be read without checking the signature. Only the email is used, for display.
 */
function emailFromIdToken(idToken: string | undefined) {
  try {
    const payload = JSON.parse(Buffer.from(idToken?.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function exchangeCode({ code, redirectUri, verifier }: { code: string; redirectUri: string; verifier: string }) {
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const scopes = tokens.scope?.split(" ") ?? [];
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    scopes,
    // Students can untick Calendar on Google's consent screen and still continue.
    hasCalendar: scopes.includes(CALENDAR_SCOPE),
    email: emailFromIdToken(tokens.id_token),
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const tokens = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
  return tokens.access_token;
}

/** Removes the app's access in the student's Google account. Failing here isn't worth stopping for. */
export async function revokeToken(token: string) {
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Couldn't revoke the Google token", error);
  }
}

export interface GoogleConnection {
  refreshToken: string;
  email: string | null;
  calendarId: string | null;
  lastSyncedAt: string | null;
  syncError: string | null;
}

// Every function below takes a user ID the server has already verified, never one from the browser.

export async function loadConnection(userId: string): Promise<GoogleConnection | null> {
  const { data, error } = await adminClient()
    .from("google_connections")
    .select("refresh_token_encrypted, google_email, calendar_id, last_synced_at, sync_error")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the Google connection: ${error.message}`);
  if (!data) return null;

  return {
    refreshToken: decryptToken(data.refresh_token_encrypted, requireKey(), userId),
    email: data.google_email,
    calendarId: data.calendar_id,
    lastSyncedAt: data.last_synced_at,
    syncError: data.sync_error,
  };
}

/** Everything except the token, which this never decrypts. */
export async function loadConnectionStatus(userId: string) {
  const { data, error } = await adminClient()
    .from("google_connections")
    .select("google_email, calendar_id, last_synced_at, sync_error")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the Google connection: ${error.message}`);
  return data;
}

export async function saveConnection(
  userId: string,
  connection: { refreshToken: string; scopes: string[]; email: string | null; calendarId: string | null },
) {
  const { error } = await adminClient()
    .from("google_connections")
    .upsert({
      user_id: userId,
      refresh_token_encrypted: encryptToken(connection.refreshToken, requireKey(), userId),
      scopes: connection.scopes,
      google_email: connection.email,
      calendar_id: connection.calendarId,
      sync_error: null,
    });
  if (error) throw new Error(`Couldn't save the Google connection: ${error.message}`);
}

export async function updateConnection(
  userId: string,
  changes: { calendar_id?: string; last_synced_at?: string; sync_error?: string | null },
) {
  const { error } = await adminClient().from("google_connections").update(changes).eq("user_id", userId);
  if (error) throw new Error(`Couldn't update the Google connection: ${error.message}`);
}

export async function deleteConnection(userId: string) {
  const { error } = await adminClient().from("google_connections").delete().eq("user_id", userId);
  if (error) throw new Error(`Couldn't remove the Google connection: ${error.message}`);
}
