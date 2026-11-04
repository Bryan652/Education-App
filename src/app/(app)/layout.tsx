import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TimezoneSync } from "@/components/settings/timezone-sync";
import { getProfileForLayout } from "@/lib/data/profile";

async function TimezoneCheck() {
  const profile = await getProfileForLayout();
  return profile && !profile.hasTimezone ? <TimezoneSync /> : null;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <TimezoneCheck />
      </Suspense>
      {children}
    </AppShell>
  );
}
