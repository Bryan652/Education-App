import type { NextConfig } from "next";

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
};

export default nextConfig;
