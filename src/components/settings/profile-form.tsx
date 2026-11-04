"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/settings";
import { fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialFormState, type FormState } from "@/lib/validation/subjects";

export function ProfileForm({
  displayName,
  timezone,
  timezones,
  children,
}: {
  displayName: string;
  timezone: string;
  timezones: string[];
  children?: React.ReactNode;
}) {
  async function save(previous: FormState, formData: FormData) {
    const result = await updateProfile(previous, formData);
    if (result.status === "success") toast(result.message);
    return result;
  }

  const [state, action, pending] = useActionState(save, initialFormState);
  const errors = state.fieldErrors ?? {};

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="profile-name" label="Name" errors={errors.display_name}>
        <Input
          id="profile-name"
          name="display_name"
          defaultValue={displayName}
          maxLength={100}
          className="h-10"
          {...fieldA11y("profile-name", errors.display_name)}
        />
      </FormField>
      <FormField
        id="profile-timezone"
        label="Time zone"
        errors={errors.timezone}
        hint="Used for your schedule, deadlines and what counts as today."
      >
        <NativeSelect
          id="profile-timezone"
          name="timezone"
          defaultValue={timezone}
          {...fieldA11y("profile-timezone", errors.timezone)}
        >
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending} className="w-fit px-4">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {children}
      </div>
    </form>
  );
}
