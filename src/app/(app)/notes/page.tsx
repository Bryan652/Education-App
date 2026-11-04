import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { NotesBrowser } from "@/components/notes/notes-browser";
import { noteExcerpt, notes } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  const items = [...notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((note) => ({
      id: note.id,
      subjectId: note.subjectId,
      title: note.title,
      updatedAt: note.updatedAt,
      excerpt: noteExcerpt(note),
    }));

  return (
    <>
      <PageHeader
        title="Notes"
        description={`${notes.length} notes across your subjects`}
        actions={
          <PreviewButton size="lg">
            <Plus aria-hidden />
            New note
          </PreviewButton>
        }
      />
      <NotesBrowser notes={items} />
    </>
  );
}
