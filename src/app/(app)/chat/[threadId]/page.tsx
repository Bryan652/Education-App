import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { getNoteContext, getSubjectContext, getThreadById, getThreads } from "@/lib/data/chat";
import { getSubjects } from "@/lib/data/subjects";
import { getThread as getSampleThread } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ threadId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  return { title: getSampleThread(threadId)?.title ?? "Chat" };
}

export default async function ChatThreadPage({ params }: Props) {
  const { threadId } = await params;
  const thread = await getThreadById(threadId);
  if (!thread) notFound();

  const [threads, { active, archived }, context] = await Promise.all([
    getThreads(),
    getSubjects(),
    // A note is more specific than its subject, so it wins if a chat has both.
    thread.noteId ? getNoteContext(thread.noteId) : thread.subjectId ? getSubjectContext(thread.subjectId) : null,
  ]);

  return (
    <ChatLayout threads={threads} subjects={[...active, ...archived]} activeThreadId={thread.id}>
      <ChatConversation
        key={thread.id}
        threadId={thread.id}
        title={thread.title}
        context={context}
        messages={thread.messages}
        saves={isSupabaseConfigured}
      />
    </ChatLayout>
  );
}
