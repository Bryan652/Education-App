import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { getNote, getThread } from "@/lib/mock-data";

type Props = { params: Promise<{ threadId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  return { title: getThread(threadId)?.title ?? "Chat" };
}

export default async function ChatThreadPage({ params }: Props) {
  const { threadId } = await params;
  const thread = getThread(threadId);
  if (!thread) notFound();

  const note = thread.noteId ? getNote(thread.noteId) : undefined;

  return (
    <ChatLayout activeThreadId={thread.id}>
      <ChatConversation
        key={thread.id}
        title={thread.title}
        contextNote={note ? { id: note.id, title: note.title } : undefined}
        initialMessages={thread.messages}
      />
    </ChatLayout>
  );
}
