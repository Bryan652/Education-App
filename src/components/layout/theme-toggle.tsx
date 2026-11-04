"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * The theme isn't known on the server, so the icons and labels switch using CSS.
 * Rendering them from the theme would make the server and browser disagree on the first load.
 */
export function ThemeToggle({ className, iconClassName = "size-4" }: { className?: string; iconClassName?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      title="Switch between night and light mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("rounded-md transition-colors", className)}
    >
      <Moon className={cn(iconClassName, "dark:hidden")} aria-hidden />
      <Sun className={cn(iconClassName, "hidden dark:block")} aria-hidden />
      <span className="sr-only dark:hidden">Switch to night mode</span>
      <span className="sr-only hidden dark:inline">Switch to light mode</span>
    </button>
  );
}
