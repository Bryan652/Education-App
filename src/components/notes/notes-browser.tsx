"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { Input } from "@/components/ui/input";
import { DEMO_TODAY, subjects } from "@/lib/mock-data";
import { cn, relativeDay } from "@/lib/utils";

interface NoteListItem {
  id: string;
  subjectId: string;
  title: string;
  updatedAt: string;
  excerpt: string;
}

export function NotesBrowser({ notes }: { notes: NoteListItem[] }) {
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const search = query.trim().toLowerCase();
  const visible = notes.filter(
    (note) =>
      (!subjectId || note.subjectId === subjectId) &&
      (!search || `${note.title} ${note.excerpt}`.toLowerCase().includes(search)),
  );

  const filters = [{ id: null as string | null, name: "All" }, ...subjects];

  return (
    <>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="h-11 bg-card pl-9 text-base"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by subject">
        {filters.map((filter) => (
          <button
            key={filter.name}
            type="button"
            aria-pressed={subjectId === filter.id}
            onClick={() => setSubjectId(filter.id)}
            className={cn(
              "rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
              subjectId === filter.id && "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No notes match your search.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="group flex h-full flex-col gap-2.5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-3">
                  <SubjectBadge subjectId={note.subjectId} />
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeDay(DEMO_TODAY, note.updatedAt)}</span>
                </div>
                <h2 className="font-heading text-lg font-semibold group-hover:underline">{note.title}</h2>
                <p className="line-clamp-2 text-sm text-muted-foreground">{note.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
