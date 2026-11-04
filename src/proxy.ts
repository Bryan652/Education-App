import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// Refreshes the login session and sends signed-out visitors to /login.
// This only guards pages. Row-level security is what actually protects each student's data.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  let noCacheHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        noCacheHeaders = headers;
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims verifies the session. Cookies alone can be forged, so never trust getSession here.
  // It throws on a malformed token, which should send the student to /login and not crash the page.
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
  } catch {
    signedIn = false;
  }

  const { pathname, search } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/auth/");

  function redirectTo(url: URL) {
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed session cookies, or the student gets signed out.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(noCacheHeaders).forEach(([key, value]) => redirect.headers.set(key, value));
    return redirect;
  }

  if (!signedIn && !isPublic) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectTo(url);
  }

  if (signedIn && pathname === "/login") {
    return redirectTo(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
