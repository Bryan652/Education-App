import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { AppAnalytics } from "@/components/layout/app-analytics";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "OLARound", template: "%s · OLARound" },
  description: "All around education app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme is set on <html> before the page shows, so the server can't know it. That's what
    // suppressHydrationWarning allows, and it only applies to this one element.
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
        {/* Its script only exists on Vercel, so local runs and self-hosted copies skip it. */}
        {process.env.VERCEL && <AppAnalytics />}
      </body>
    </html>
  );
}
