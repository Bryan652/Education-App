import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TimezoneSync } from "@/components/settings/timezone-sync";
import { getProfile } from "@/lib/data/profile";

async function TimezoneCheck() {
  const { hasTimezone } = await getProfile();
  return hasTimezone ? null : <TimezoneSync />;
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
