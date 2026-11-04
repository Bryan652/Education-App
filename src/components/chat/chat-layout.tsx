import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SubjectBadge } from "@/components/subjects/subject-badge";
import { buttonVariants } from "@/components/ui/button";
import type { ThreadSummary } from "@/lib/data/chat";
import { cn } from "@/lib/utils";

export function ChatLayout({
  threads,
  subjects,
  activeThreadId,
  children,
}: {
  threads: ThreadSummary[];
  subjects: { id: string; name: string; color: string }[];
  activeThreadId?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid h-[calc(100dvh-10.5rem)] overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 md:grid-cols-[17rem_1fr] lg:h-[calc(100dvh-5rem)]">
      <aside className="hidden min-h-0 flex-col border-r md:flex">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <h1 className="px-1 font-heading text-lg font-semibold">AI chat</h1>
          <Link href="/chat" className={cn(buttonVariants({ variant: "outline" }))}>
            <Plus aria-hidden />
            New
          </Link>
        </div>
        {threads.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Your chats will appear here.</p>
        ) : (
          <ul className="flex-1 overflow-y-auto p-2">
            {threads.map((thread) => {
              const subject = subjects.find((item) => item.id === thread.subjectId);
              return (
                <li key={thread.id}>
                  <Link
                    href={`/chat/${thread.id}`}
                    aria-current={thread.id === activeThreadId ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-lg p-2.5 transition-colors hover:bg-muted",
                      thread.id === activeThreadId && "bg-muted",
                    )}
                  >
                    <span className="line-clamp-2 text-sm font-medium wrap-anywhere">{thread.title}</span>
                    {subject && <SubjectBadge subject={subject} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
    </div>
  );
}
