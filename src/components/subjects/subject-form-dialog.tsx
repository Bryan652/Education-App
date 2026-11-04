"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createSubject, updateSubject } from "@/actions/subjects";
import { FieldError, fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
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
import type { SubjectRecord, Term } from "@/lib/data/subjects";
import { DEFAULT_SUBJECT_COLOR, initialFormState, SUBJECT_COLORS, type FormState } from "@/lib/validation/subjects";

export interface ScaleOption {
  id: string;
  name: string;
}

function SubjectForm({
  subject,
  terms,
  scales,
  defaultTermId,
  onDone,
}: {
  subject?: SubjectRecord;
  terms: Term[];
  scales: ScaleOption[];
  defaultTermId?: string;
  onDone: () => void;
}) {
  async function save(previous: FormState, formData: FormData) {
    const result = subject
      ? await updateSubject(subject.id, previous, formData)
      : await createSubject(previous, formData);
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
  const selectedColor = subject?.color ?? DEFAULT_SUBJECT_COLOR;
  const isPaletteColor = SUBJECT_COLORS.some((color) => color.value === selectedColor);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="subject-name" label="Name" errors={errors.name}>
        <Input
          id="subject-name"
          name="name"
          defaultValue={subject?.name}
          maxLength={100}
          required
          autoFocus
          placeholder="Calculus II"
          className="h-10"
          {...fieldA11y("subject-name", errors.name)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="subject-code" label="Code" optional errors={errors.code}>
          <Input
            id="subject-code"
            name="code"
            defaultValue={subject?.code}
            maxLength={30}
            placeholder="MATH 122"
            className="h-10"
            {...fieldA11y("subject-code", errors.code)}
          />
        </FormField>
        <FormField id="subject-units" label="Units" optional errors={errors.units}>
          <Input
            id="subject-units"
            name="units"
            type="number"
            min="0"
            max="99.99"
            step="0.5"
            inputMode="decimal"
            defaultValue={subject?.units || undefined}
            placeholder="3"
            className="h-10"
            {...fieldA11y("subject-units", errors.units)}
          />
        </FormField>
      </div>

      <FormField id="subject-instructor" label="Instructor" optional errors={errors.instructor}>
        <Input
          id="subject-instructor"
          name="instructor"
          defaultValue={subject?.instructor}
          maxLength={100}
          placeholder="Dr. Ramos"
          className="h-10"
          {...fieldA11y("subject-instructor", errors.instructor)}
        />
      </FormField>

      <FormField
        id="subject-term"
        label="Term"
        optional
        errors={errors.term_id}
        hint={
          terms.length === 0 ? (
            <>
              You don&apos;t have any terms yet. You can add them in{" "}
              <Link href="/settings" className="underline">
                Settings
              </Link>
              .
            </>
          ) : undefined
        }
      >
        <NativeSelect
          id="subject-term"
          name="term_id"
          defaultValue={subject ? (subject.termId ?? "") : (defaultTermId ?? "")}
          {...fieldA11y("subject-term", errors.term_id)}
        >
          <option value="">No term</option>
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <FormField
        id="subject-scale"
        label="Grading scale"
        optional
        errors={errors.grading_scale_id}
        hint={
          <>
            Only choose one if this subject is graded differently. You can add scales in{" "}
            <Link href="/settings" className="underline">
              Settings
            </Link>
            .
          </>
        }
      >
        <NativeSelect
          id="subject-scale"
          name="grading_scale_id"
          defaultValue={subject?.gradingScaleId ?? ""}
          {...fieldA11y("subject-scale", errors.grading_scale_id)}
        >
          <option value="">Use my default</option>
          {scales.map((scale) => (
            <option key={scale.id} value={scale.id}>
              {scale.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {!isPaletteColor && (
            <label className="cursor-pointer">
              <input type="radio" name="color" value={selectedColor} defaultChecked className="peer sr-only" />
              <span className="sr-only">Current color</span>
              <span
                aria-hidden
                className="block size-8 rounded-full ring-offset-2 ring-offset-popover peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring"
                style={{ backgroundColor: selectedColor }}
              />
            </label>
          )}
          {SUBJECT_COLORS.map((color) => (
            <label key={color.value} className="cursor-pointer" title={color.name}>
              <input
                type="radio"
                name="color"
                value={color.value}
                defaultChecked={color.value === selectedColor}
                className="peer sr-only"
              />
              <span className="sr-only">{color.name}</span>
              <span
                aria-hidden
                className="block size-8 rounded-full ring-offset-2 ring-offset-popover peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring"
                style={{ backgroundColor: color.value }}
              />
            </label>
          ))}
        </div>
        <FieldError id="subject-color-error" errors={errors.color} />
      </fieldset>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <DialogFooter>
        <Button type="submit" size="lg" disabled={pending} className="px-4">
          {pending ? "Saving…" : subject ? "Save changes" : "Add subject"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SubjectFormDialog({
  subject,
  terms,
  scales,
  variant = "default",
  children,
}: {
  subject?: SubjectRecord;
  terms: Term[];
  scales: ScaleOption[];
  variant?: "default" | "outline";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // New subjects start in the most recent term, since that's usually the current one.
  const defaultTermId = terms[0]?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size="lg" className="px-3" />}>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{subject ? "Edit subject" : "Add a subject"}</DialogTitle>
          <DialogDescription>
            {subject ? "Update this subject's details." : "Only the name is required, and you can change anything later."}
          </DialogDescription>
        </DialogHeader>
        <SubjectForm
          subject={subject}
          terms={terms}
          scales={scales}
          defaultTermId={defaultTermId}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
