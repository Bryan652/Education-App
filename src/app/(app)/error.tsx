"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <h1 className="mt-5 font-heading text-3xl font-semibold">This page didn&apos;t load</h1>
      <p className="mt-2 text-muted-foreground">Something went wrong while loading your data. Your work is safe.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button size="lg" className="px-4" onClick={() => retry()}>
          Try again
        </Button>
        {/* On phones, signing out is otherwise only on the Settings page, which may be failing too. */}
        <SignOutButton />
      </div>
    </div>
  );
}
