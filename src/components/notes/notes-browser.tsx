"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { Input } from "@/components/ui/input";
import type { NoteListItem } from "@/lib/data/notes";
import { cn, relativeDay } from "@/lib/utils";

const SEARCH_DELAY_MS = 250;

interface SubjectOption {
  id: string;
  name: string;
  color: string;
}

function notesUrl(search: string, subjectId: string | null) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  if (subjectId) params.set("subject", subjectId);
  const query = params.toString();
  return query ? `/notes?${query}` : "/notes";
}

// The search and subject live in the URL, so reloading or sharing the link keeps them.
export function NotesBrowser({
  notes,
  subjects,
  filterSubjects,
  search,
  subjectId,
  today,
}: {
  notes: NoteListItem[];
  subjects: SubjectOption[];
  filterSubjects: SubjectOption[];
  search: string;
  subjectId: string | null;
  today: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [searching, startSearch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onSearchChange(next: string) {
    setQuery(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startSearch(() => router.replace(notesUrl(next, subjectId), { scroll: false }));
    }, SEARCH_DELAY_MS);
  }

  const filters = [{ id: null as string | null, name: "All" }, ...filterSubjects];
  const isFiltered = Boolean(search.trim() || subjectId);

  return (
    <>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="h-11 bg-card pl-9 text-base"
        />
      </div>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filter by subject">
        {filters.map((filter) => (
          <Link
            key={filter.id ?? "all"}
            href={notesUrl(query, filter.id)}
            replace
            scroll={false}
            aria-current={subjectId === filter.id ? "true" : undefined}
            className={cn(
              "rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
              subjectId === filter.id && "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {filter.name}
          </Link>
        ))}
      </nav>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {isFiltered ? "No notes match your search." : "You don't have any notes yet."}
        </p>
      ) : (
        <ul className={cn("grid gap-4 transition-opacity md:grid-cols-2", searching && "opacity-60")}>
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="group flex h-full flex-col gap-2.5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-3">
                  <SubjectBadge subject={subjects.find((subject) => subject.id === note.subjectId)} />
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeDay(today, note.updatedAt)}</span>
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
