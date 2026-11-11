import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, Settings } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserName } from "@/components/auth/user-name";
import { BottomNavLinks, LastChatTracker, SidebarNavLinks, SidebarSettingsLink } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-60">
      <LastChatTracker />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pt-6 pb-7">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="font-heading text-lg font-semibold text-sidebar-accent-foreground">OLARound</span>
        </Link>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
          <SidebarNavLinks />
        </nav>

        <div className="flex flex-col gap-1 border-t border-sidebar-border p-3">
          <SidebarSettingsLink />
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <UserName />
              {!isSupabaseConfigured && <p className="text-xs">Sample data</p>}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <ThemeToggle className="p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
              <SignOutButton iconOnly />
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" aria-hidden />
          </span>
          <span className="font-heading font-semibold">OLARound</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="p-2 hover:bg-muted" iconClassName="size-5" />
          <Link href="/settings" aria-label="Settings" className="rounded-md p-2 hover:bg-muted">
            <Settings className="size-5" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <BottomNavLinks />
      </nav>
    </div>
  );
}
