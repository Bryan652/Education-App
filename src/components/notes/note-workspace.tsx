"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import type { Content, JSONContent } from "@tiptap/react";
import { toast } from "sonner";
import { moveNote, saveNote } from "@/actions/notes";
import { NativeSelect } from "@/components/layout/form-field";
import { NoteEditor } from "@/components/notes/note-editor";
import { NOTE_TITLE_MAX } from "@/lib/validation/notes";

const SAVE_DELAY_MS = 1200;
const UNTITLED = "Untitled note";

type SaveStatus = { state: "saved" | "unsaved" | "saving" } | { state: "error"; message: string };

function statusText(status: SaveStatus) {
  switch (status.state) {
    case "saved":
      return "All changes saved";
    case "unsaved":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "error":
      return status.message;
  }
}

/** The title and body of a note the student owns, saved automatically as they type. */
export function NoteWorkspace({
  noteId,
  title,
  content,
  subjectId,
  subjects,
}: {
  noteId: string;
  title: string;
  content: Content;
  subjectId: string;
  subjects: { id: string; name: string }[];
}) {
  const [status, setStatus] = useState<SaveStatus>({ state: "saved" });
  const [moving, startMoving] = useTransition();
  const [currentSubject, setCurrentSubject] = useState(subjectId);
  const [editor, setEditor] = useState({ key: 0, content });

  // Refs, because saving must always use the newest text, even from an older timer or a cleanup.
  const latest = useRef({ title, content });
  const dirty = useRef(false);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function flush() {
    clearTimeout(timer.current);
    if (!dirty.current || saving.current) return;

    saving.current = true;
    dirty.current = false;
    setStatus({ state: "saving" });

    const result = await saveNote(noteId, {
      title: latest.current.title.trim() || UNTITLED,
      content: latest.current.content,
    }).catch(() => ({ ok: false, message: "Couldn't save. Check your connection." }));

    saving.current = false;
    if (!result.ok) {
      dirty.current = true;
      setStatus({ state: "error", message: result.message });
    } else if (dirty.current) {
      // More typing arrived during the save.
      schedule();
    } else {
      setStatus({ state: "saved" });
    }
  }

  function schedule() {
    dirty.current = true;
    setStatus({ state: "unsaved" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
  }

  function onContentChange(next: JSONContent) {
    latest.current.content = next;
    schedule();
  }

  function onTitleChange(next: string) {
    latest.current.title = next;
    schedule();
  }

  // Next.js keeps this page mounted but hidden after leaving it, which destroys the editor. So
  // anything unsaved gets saved now, and the editor is rebuilt from the newest text for the next
  // visit. Otherwise it would come back showing the text it first loaded, then save over the note.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useLayoutEffect(() => {
    const current = latest.current;
    return () => {
      void flushRef.current();
      setEditor((previous) => ({ key: previous.key + 1, content: current.content }));
    };
  }, []);

  // Closing the tab can't wait for a save, so the browser asks first.
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (dirty.current || saving.current) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <NativeSelect
          aria-label="Subject"
          value={currentSubject}
          disabled={moving}
          className="h-8 w-auto max-w-full"
          onChange={(event) => {
            const previous = currentSubject;
            const next = event.target.value;
            setCurrentSubject(next);
            startMoving(async () => {
              const result = await moveNote(noteId, next);
              toast(result.message);
              if (!result.ok) setCurrentSubject(previous);
            });
          }}
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <h1 className="mb-5">
        <input
          aria-label="Title"
          defaultValue={title}
          maxLength={NOTE_TITLE_MAX}
          placeholder={UNTITLED}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full bg-transparent font-heading text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground sm:text-4xl"
        />
      </h1>
      <NoteEditor
        key={editor.key}
        content={editor.content}
        onChange={onContentChange}
        status={
          <span
            role={status.state === "error" ? "alert" : "status"}
            className={status.state === "error" ? "text-destructive" : undefined}
          >
            {statusText(status)}
            {status.state === "error" && (
              <button type="button" className="ml-2 font-medium underline" onClick={() => void flush()}>
                Try again
              </button>
            )}
          </span>
        }
      />
    </>
  );
}
