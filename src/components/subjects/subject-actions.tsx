"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { archiveSubject, deleteSubject, restoreSubject } from "@/actions/subjects";
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

export function ArchiveButton({ subjectId }: { subjectId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="lg"
      className="px-3"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          toast((await archiveSubject(subjectId)).message);
        })
      }
    >
      <Archive aria-hidden />
      Archive
    </Button>
  );
}

export function RestoreButton({ subjectId, variant = "outline" }: { subjectId: string; variant?: "outline" | "default" }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size="lg"
      className="px-3"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          toast((await restoreSubject(subjectId)).message);
        })
      }
    >
      <ArchiveRestore aria-hidden />
      Restore
    </Button>
  );
}

export function DeleteSubjectButton({
  subjectId,
  subjectName,
  isArchived,
}: {
  subjectId: string;
  subjectName: string;
  isArchived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>, closeOnSuccess: boolean) {
    startTransition(async () => {
      // A successful delete redirects to the subject list and never returns here.
      const result = await action();
      toast(result.message);
      if (closeOnSuccess && result.ok) setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" size="lg" className="px-3 text-destructive hover:text-destructive" />}>
        <Trash2 aria-hidden />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent className="data-[size=default]:sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {subjectName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the subject, along with its classes, notes, quiz cards and grades. It can&apos;t be
            undone.
            {!isArchived && " If you're just done with it for now, archive it instead."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" className="px-3" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          {!isArchived && (
            <Button variant="outline" size="lg" className="px-3" disabled={pending} onClick={() => run(() => archiveSubject(subjectId), true)}>
              Archive instead
            </Button>
          )}
          <Button variant="destructive" size="lg" className="px-3" disabled={pending} onClick={() => run(() => deleteSubject(subjectId), false)}>
            {pending ? "Working…" : "Delete permanently"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
