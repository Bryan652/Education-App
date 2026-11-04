"use client";

import type { ComponentProps, ReactNode } from "react";
import { createNote, deleteNote } from "@/actions/notes";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { FormDialog } from "@/components/layout/form-dialog";
import { fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import type { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NOTE_TITLE_MAX } from "@/lib/validation/notes";

export function NewNoteDialog({
  subjects,
  subjectId,
  triggerProps,
  trigger,
}: {
  subjects: { id: string; name: string }[];
  subjectId?: string;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title="New note"
      description="Every note belongs to a subject. You can move it later."
      submitLabel="Create note"
      action={createNote}
      triggerProps={triggerProps}
      trigger={trigger}
    >
      {(errors) => (
        <>
          <FormField id="note-title" label="Title" errors={errors.title}>
            <Input
              id="note-title"
              name="title"
              maxLength={NOTE_TITLE_MAX}
              required
              autoFocus
              placeholder="Integration by parts"
              className="h-10"
              {...fieldA11y("note-title", errors.title)}
            />
          </FormField>
          <FormField id="note-subject" label="Subject" errors={errors.subject_id}>
            <NativeSelect
              id="note-subject"
              name="subject_id"
              defaultValue={subjectId}
              {...fieldA11y("note-subject", errors.subject_id)}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteNoteButton({ noteId, title, fileCount }: { noteId: string; title: string; fileCount: number }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${title}`}
      visibleLabel="Delete"
      title={`Delete ${title}?`}
      description={
        fileCount > 0
          ? `This also deletes ${fileCount === 1 ? "its attached file" : `its ${fileCount} attached files`}, and can't be undone.`
          : "This can't be undone."
      }
      action={() => deleteNote(noteId)}
    />
  );
}
