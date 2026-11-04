import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getNoteContext, getSubjectContext, getThreads } from "@/lib/data/chat";
import { getNotes } from "@/lib/data/notes";
import { getSubjects } from "@/lib/data/subjects";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "AI chat" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function NewChat({ searchParams }: { searchParams: SearchParams }) {
  const { note, subject } = await searchParams;
  const [threads, { active, archived }, notes, context] = await Promise.all([
    getThreads(),
    getSubjects(),
    getNotes({ limit: 100 }),
    typeof note === "string" ? getNoteContext(note) : typeof subject === "string" ? getSubjectContext(subject) : null,
  ]);

  return (
    <ChatLayout threads={threads} subjects={[...active, ...archived]}>
      <ChatConversation
        key={context ? `${context.kind}:${context.id}` : "new"}
        context={context}
        messages={[]}
        saves={isSupabaseConfigured}
        recentThreads={threads}
        contextOptions={{
          subjects: active.map(({ id, name }) => ({ id, name })),
          notes: notes.map(({ id, title }) => ({ id, title })),
        }}
      />
    </ChatLayout>
  );
}

export default function ChatPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewChat searchParams={searchParams} />
    </Suspense>
  );
}
