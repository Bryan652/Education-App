import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Content } from "@tiptap/react";
import { MessageCircle, Paperclip, Sparkles } from "lucide-react";
import { PreviewButton } from "@/components/layout/preview-button";
import { NoteAttachments } from "@/components/notes/note-attachments";
import { DeleteNoteButton } from "@/components/notes/note-dialogs";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteWorkspace } from "@/components/notes/note-workspace";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import { getNoteById, getStorageUsed } from "@/lib/data/notes";
import { getClock } from "@/lib/data/profile";
import { getSubjects } from "@/lib/data/subjects";
import { chatThreads, getNote as getSampleNote } from "@/lib/mock-data";
import { cn, relativeDay } from "@/lib/utils";

type Props = { params: Promise<{ noteId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { noteId } = await params;
  return { title: getSampleNote(noteId)?.title ?? "Note" };
}

export default async function NotePage({ params }: Props) {
  const { noteId } = await params;
  const note = await getNoteById(noteId);
  if (!note) notFound();

  const thread = chatThreads.find((item) => item.noteId === note.id);
  const [{ active, archived }, { today }, usedBytes] = await Promise.all([
    getSubjects(),
    getClock(),
    note.isSample ? 0 : getStorageUsed(),
  ]);

  // Includes the note's own subject, in case it's been archived.
  const subjectOptions = [...active, ...archived]
    .filter((subject) => !subject.archivedAt || subject.id === note.subjectId)
    .map(({ id, name }) => ({ id, name }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/notes" className="text-sm font-medium text-muted-foreground hover:underline">
          ← All notes
        </Link>
        <div className="flex flex-wrap gap-2">
          <PreviewButton variant="outline" size="lg" message="This is a preview, so AI can't generate cards yet.">
            <Sparkles aria-hidden />
            Make cards
          </PreviewButton>
          <Link
            href={thread ? `/chat/${thread.id}` : "/chat"}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            <MessageCircle aria-hidden />
            Ask AI
          </Link>
          {!note.isSample && <DeleteNoteButton noteId={note.id} title={note.title} fileCount={note.files.length} />}
        </div>
      </div>

      <article className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
        {note.isSample ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <SubjectBadge subjectId={note.subjectId} />
              <span className="text-xs text-muted-foreground">Edited {relativeDay(today, note.updatedAt).toLowerCase()}</span>
            </div>
            <h1 className="mb-5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{note.title}</h1>
            <NoteEditor content={note.content as Content} status="Changes aren't saved in this preview" />

            <section className="mt-8 border-t pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium">Attachments</h2>
                <PreviewButton variant="ghost" message="This is a preview, so files can't be uploaded yet.">
                  <Paperclip aria-hidden />
                  Attach file
                </PreviewButton>
              </div>
              {note.files.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {note.files.map((file) => (
                    <li key={file.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
                      <span className="truncate font-medium">{file.fileName}</span>
                      <span className="shrink-0 text-muted-foreground">{file.size}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No files attached.</p>
              )}
            </section>
          </>
        ) : (
          <>
            <NoteWorkspace
              key={note.id}
              noteId={note.id}
              title={note.title}
              content={note.content as Content}
              subjectId={note.subjectId}
              subjects={subjectOptions}
            />
            <NoteAttachments noteId={note.id} files={note.files} usedBytes={usedBytes} />
          </>
        )}
      </article>
    </div>
  );
}
