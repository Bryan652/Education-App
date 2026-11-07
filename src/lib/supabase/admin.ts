import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// Skips row-level security, so every query here must filter by a user ID the server has verified.
// Only used for google_connections, which the browser has no access to at all.
const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";

export const isAdminConfigured = Boolean(supabaseUrl && secretKey);

let client: ReturnType<typeof createClient<Database>> | undefined;

export function adminClient() {
  if (!isAdminConfigured) throw new Error("SUPABASE_SECRET_KEY isn't set.");
  client ??= createClient<Database>(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
