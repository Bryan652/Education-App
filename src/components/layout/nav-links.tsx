"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Layers,
  LayoutDashboard,
  MessageCircle,
  NotebookPen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", shortLabel: "Subjects", icon: BookOpen },
  { href: "/schedule", label: "Schedule", shortLabel: "Schedule", icon: CalendarDays },
  { href: "/notes", label: "Notes", shortLabel: "Notes", icon: NotebookPen },
  { href: "/decks", label: "Quiz cards", shortLabel: "Cards", icon: Layers },
  { href: "/chat", label: "AI chat", shortLabel: "Chat", icon: MessageCircle },
];

const SIDEBAR_LINK =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const SIDEBAR_LINK_ACTIVE = "bg-sidebar-accent text-sidebar-accent-foreground";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarItems({ pathname }: { pathname: string }) {
  return NAV_ITEMS.map((item) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(SIDEBAR_LINK, active && SIDEBAR_LINK_ACTIVE)}
      >
        <item.icon className={cn("size-4.5", active && "text-sidebar-primary")} aria-hidden />
        {item.label}
      </Link>
    );
  });
}

function SettingsItem({ pathname }: { pathname: string }) {
  const active = isActive(pathname, "/settings");
  return (
    <Link
      href="/settings"
      aria-current={active ? "page" : undefined}
      className={cn(SIDEBAR_LINK, active && SIDEBAR_LINK_ACTIVE)}
    >
      <Settings className={cn("size-4.5", active && "text-sidebar-primary")} aria-hidden />
      Settings
    </Link>
  );
}

function BottomItems({ pathname }: { pathname: string }) {
  return NAV_ITEMS.map((item) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 py-2 text-[0.6875rem] font-medium text-muted-foreground",
          active && "text-primary",
        )}
      >
        <item.icon className="size-5" aria-hidden />
        {item.shortLabel}
      </Link>
    );
  });
}

function WithPathname({ children }: { children: (pathname: string) => ReactNode }) {
  return children(usePathname());
}

// Next.js needs the current URL read inside Suspense. Until it's known, the links show with no active item.
export function SidebarNavLinks() {
  return (
    <Suspense fallback={<SidebarItems pathname="" />}>
      <WithPathname>{(pathname) => <SidebarItems pathname={pathname} />}</WithPathname>
    </Suspense>
  );
}

export function SidebarSettingsLink() {
  return (
    <Suspense fallback={<SettingsItem pathname="" />}>
      <WithPathname>{(pathname) => <SettingsItem pathname={pathname} />}</WithPathname>
    </Suspense>
  );
}

export function BottomNavLinks() {
  return (
    <Suspense fallback={<BottomItems pathname="" />}>
      <WithPathname>{(pathname) => <BottomItems pathname={pathname} />}</WithPathname>
    </Suspense>
  );
}
