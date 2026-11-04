"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    if (isSupabaseConfigured) {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setPending(false);
        toast("Couldn't sign out. Please try again.");
        return;
      }
    }
    // A full page load clears the pages Next.js keeps hidden, so private data doesn't stay in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see above
    window.location.assign("/login");
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        aria-label="Sign out"
        title="Sign out"
        className="rounded-md p-1.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" size="lg" onClick={signOut} disabled={pending} className="w-fit">
      <LogOut aria-hidden />
      Sign out
    </Button>
  );
}
