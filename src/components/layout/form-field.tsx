import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function FormField({
  id,
  label,
  optional,
  errors,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  errors?: string[];
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <FieldError id={`${id}-error`} errors={errors} />
    </div>
  );
}

// Connects an input to its error message for screen readers.
export function fieldA11y(id: string, errors?: string[]) {
  return errors?.length ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};
}
