"use client";

import { startTransition, useActionState, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createTerm, deleteTerm, updateTerm } from "@/actions/settings";
import { fieldA11y, FormField } from "@/components/layout/form-field";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Term } from "@/lib/data/subjects";
import { initialFormState, type FormState } from "@/lib/validation/subjects";

function TermForm({ term, onDone }: { term?: Term; onDone: () => void }) {
  async function save(previous: FormState, formData: FormData) {
    const result = term ? await updateTerm(term.id, previous, formData) : await createTerm(previous, formData);
    if (result.status === "success") {
      toast(result.message);
      onDone();
    }
    return result;
  }

  const [state, action, pending] = useActionState(save, initialFormState);
  const errors = state.fieldErrors ?? {};

  // Submitting by hand keeps what was typed. A plain form action would clear it, even on an error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="term-name" label="Name" errors={errors.name}>
        <Input
          id="term-name"
          name="name"
          defaultValue={term?.name}
          maxLength={100}
          required
          autoFocus
          placeholder="1st Semester 2026-2027"
          className="h-10"
          {...fieldA11y("term-name", errors.name)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="term-start" label="Start date" errors={errors.start_date}>
          <Input
            id="term-start"
            name="start_date"
            type="date"
            defaultValue={term?.startDate}
            required
            className="h-10"
            {...fieldA11y("term-start", errors.start_date)}
          />
        </FormField>
        <FormField id="term-end" label="End date" errors={errors.end_date}>
          <Input
            id="term-end"
            name="end_date"
            type="date"
            defaultValue={term?.endDate}
            required
            className="h-10"
            {...fieldA11y("term-end", errors.end_date)}
          />
        </FormField>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" size="lg" disabled={pending} className="px-4">
          {pending ? "Saving…" : term ? "Save changes" : "Add term"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TermFormDialog({
  term,
  variant = "outline",
  children,
}: {
  term?: Term;
  variant?: "outline" | "ghost";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size="lg" className="w-fit px-3" />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{term ? "Edit term" : "Add a term"}</DialogTitle>
          <DialogDescription>A semester or school term that your subjects belong to.</DialogDescription>
        </DialogHeader>
        <TermForm term={term} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTermButton({ term }: { term: Term }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        aria-label={`Delete ${term.name}`}
        render={<Button variant="ghost" size="icon-lg" className="text-destructive hover:text-destructive" />}
      >
        <Trash2 aria-hidden />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {term.name}?</AlertDialogTitle>
          <AlertDialogDescription>Its subjects stay, but they&apos;ll no longer belong to a term.</AlertDialogDescription>
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
                const result = await deleteTerm(term.id);
                toast(result.message);
                if (result.ok) setOpen(false);
              })
            }
          >
            Delete term
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
