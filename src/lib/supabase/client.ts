import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
