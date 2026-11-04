import type { NextConfig } from "next";
import { PROVIDER_ORIGINS } from "./src/lib/ai/providers";

const isDev = process.env.NODE_ENV === "development";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";

// Students' AI keys live in the browser, so this limits what a script could do with one.
// connect-src is the important line: the page can only talk to this site, Supabase and the AI
// providers. Next.js needs inline scripts, and the nonce alternative would make every page render
// on demand, which rules out the static shells that keep navigation fast.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${PROVIDER_ORIGINS.join(" ")}${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  // Signing in with Google goes through Supabase, then Google.
  `form-action 'self' ${supabaseOrigin} https://accounts.google.com`,
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keeps visited pages in browser memory for 5 minutes, so going back to a tab is instant and
    // makes no requests. Every save clears it, and a reload or signing out empties it.
    staleTimes: { dynamic: 300 },
  },
  // The dev badge sits on top of the sidebar profile and the phone navigation.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] }];
  },
};

export default nextConfig;
