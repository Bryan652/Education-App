import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// Row-level security enforces who owns what. This check just gives Server Actions a clearer message.
export async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? { supabase, userId: data.claims.sub } : null;
}

// Create a new client for each request, because it reads that request's cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't write cookies, and proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
