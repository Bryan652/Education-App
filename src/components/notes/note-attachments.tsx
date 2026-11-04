"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { deleteNoteFile, getNoteFileUrl, prepareNoteUpload, recordNoteFile } from "@/actions/notes";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { Button } from "@/components/ui/button";
import type { NoteFileRecord } from "@/lib/data/notes";
import { FILE_INPUT_ACCEPT, fileTypeOf, formatBytes, MAX_FILE_BYTES, MAX_STORAGE_BYTES, NOTE_FILES_BUCKET } from "@/lib/notes/limits";
import { createClient } from "@/lib/supabase/client";

// Uploads go straight from the browser to Storage, because Server Actions have a 1 MB request limit.
async function uploadFile(noteId: string, file: File) {
  const details = { name: file.name, size: file.size, type: fileTypeOf(file.name, file.type) };

  const prepared = await prepareNoteUpload(noteId, details);
  if (!prepared.ok) return prepared.message;

  const bucket = createClient().storage.from(NOTE_FILES_BUCKET);
  const upload = await bucket.upload(prepared.path, file, { contentType: details.type });
  if (upload.error) return "Couldn't upload that file. Please try again.";

  const recorded = await recordNoteFile(noteId, prepared.path, details);
  if (!recorded.ok) await bucket.remove([prepared.path]);
  return recorded.message;
}

// Saved from here because Storage's own download option garbles names with symbols, like "(final).pdf".
async function saveFile(url: string, fileName: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed with status ${response.status}`);

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function NoteAttachments({
  noteId,
  files,
  usedBytes,
}: {
  noteId: string;
  files: NoteFileRecord[];
  usedBytes: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, startDownload] = useTransition();

  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      toast(await uploadFile(noteId, file));
    } catch {
      toast("Couldn't upload that file. Check your connection and try again.");
    } finally {
      setUploading(false);
      // Lets the student choose the same file again.
      if (input.current) input.current.value = "";
    }
  }

  return (
    <section className="mt-8 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Attachments</h2>
          <p className="text-xs text-muted-foreground">
            {formatBytes(usedBytes)} of {formatBytes(MAX_STORAGE_BYTES)} used · up to {formatBytes(MAX_FILE_BYTES)} per file
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept={FILE_INPUT_ACCEPT}
          aria-label="Choose a file to attach"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void onFileChosen(event.target.files?.[0])}
        />
        <Button variant="ghost" disabled={uploading} onClick={() => input.current?.click()}>
          <Paperclip aria-hidden />
          {uploading ? "Uploading…" : "Attach file"}
        </Button>
      </div>
      {files.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-1 rounded-lg bg-muted py-1 pr-1 pl-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium">{file.fileName}</span>
              <span className="shrink-0 px-2 text-muted-foreground">{file.size}</span>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Download ${file.fileName}`}
                disabled={downloading}
                onClick={() =>
                  startDownload(async () => {
                    const result = await getNoteFileUrl(file.id);
                    if (!result.ok) {
                      toast(result.message);
                      return;
                    }
                    await saveFile(result.url, file.fileName).catch(() =>
                      toast("Couldn't download this file. Please try again."),
                    );
                  })
                }
              >
                <Download aria-hidden />
              </Button>
              <ConfirmDeleteButton
                label={`Delete ${file.fileName}`}
                title={`Delete ${file.fileName}?`}
                description="This can't be undone."
                action={() => deleteNoteFile(file.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No files attached.</p>
      )}
    </section>
  );
}
