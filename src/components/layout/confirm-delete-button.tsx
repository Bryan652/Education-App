"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
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

/** A delete button that asks first. Shows only an icon unless given a visible label. */
export function ConfirmDeleteButton({
  label,
  visibleLabel,
  title,
  description,
  confirmLabel = "Delete",
  action,
}: {
  label: string;
  visibleLabel?: string;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  action: () => Promise<{ ok: boolean; message: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        aria-label={label}
        render={
          <Button
            variant="ghost"
            size={visibleLabel ? "lg" : "icon-lg"}
            className={visibleLabel ? "px-3 text-destructive hover:text-destructive" : "text-destructive hover:text-destructive"}
          />
        }
      >
        <Trash2 aria-hidden />
        {visibleLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" className="px-3" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="lg"
            className="px-3"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                // Some actions redirect when they succeed, and never return here.
                const result = await action();
                toast(result.message);
                if (result.ok) setOpen(false);
              })
            }
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
