"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeAllAiKeys, useAiKeys } from "@/lib/ai/keys";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const hasKeys = useAiKeys().length > 0;
  // Ticked by default, because otherwise the next student on this computer could use a paid key.
  const [removeKeys, setRemoveKeys] = useState(true);

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
    if (removeKeys) removeAllAiKeys();
    // A full page load clears the pages Next.js keeps hidden, so private data doesn't stay in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see above
    window.location.assign("/login");
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {iconOnly ? (
        <AlertDialogTrigger
          aria-label="Sign out"
          title="Sign out"
          render={
            <button
              type="button"
              className="rounded-md p-1.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            />
          }
        >
          <LogOut className="size-4" aria-hidden />
        </AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger render={<Button type="button" variant="outline" size="lg" className="w-fit" />}>
          <LogOut aria-hidden />
          Sign out
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            Your work stays saved to your account. You&apos;ll need to sign in again to get back to it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasKeys && (
          <label className="flex items-start gap-2 px-4 pb-4 text-sm">
            <input
              type="checkbox"
              checked={removeKeys}
              onChange={(event) => setRemoveKeys(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            Also remove my AI keys from this device
          </label>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" className="px-3" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button size="lg" className="px-3" disabled={pending} onClick={signOut}>
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
