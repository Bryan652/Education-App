"use client";

import {
  startTransition,
  useActionState,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { initialFormState, type FormState } from "@/lib/validation/subjects";

type FieldErrors = Record<string, string[] | undefined>;

function DialogForm({
  action,
  submitLabel,
  onDone,
  children,
}: {
  action: (formData: FormData) => Promise<FormState>;
  submitLabel: string;
  onDone: () => void;
  children: (errors: FieldErrors) => ReactNode;
}) {
  const router = useRouter();

  async function save(_previous: FormState, formData: FormData) {
    const result = await action(formData);
    if (result.status === "success") {
      toast(result.message);
      // Closed by hand, not left to a server redirect, because Next.js keeps this page mounted
      // while hidden, so the dialog would still be open when the student came back.
      onDone();
      if (result.redirectTo) router.push(result.redirectTo);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(save, initialFormState);

  // Submitting by hand keeps what was typed. A plain form action would clear it, even on an error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {children(state.fieldErrors ?? {})}
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" size="lg" disabled={pending} className="px-4">
          {pending ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** A button that opens a form. The form resets each time, because closing the dialog unmounts it. */
export function FormDialog({
  title,
  description,
  submitLabel,
  action,
  triggerProps,
  trigger,
  contentClassName = "sm:max-w-md",
  stayOpen = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  submitLabel: string;
  action: (formData: FormData) => Promise<FormState>;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
  contentClassName?: string;
  // Clears the form after saving instead of closing, for adding several things in a row.
  stayOpen?: boolean;
  children: (errors: FieldErrors) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="px-3" {...triggerProps} />}>{trigger}</DialogTrigger>
      <DialogContent className={`max-h-[90dvh] overflow-y-auto ${contentClassName}`}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogForm
          key={formKey}
          action={action}
          submitLabel={submitLabel}
          onDone={() => (stayOpen ? setFormKey((key) => key + 1) : setOpen(false))}
        >
          {children}
        </DialogForm>
      </DialogContent>
    </Dialog>
  );
}
