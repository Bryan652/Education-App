import type { Metadata } from "next";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatLayout } from "@/components/chat/chat-layout";

export const metadata: Metadata = { title: "AI chat" };

export default function ChatPage() {
  return (
    <ChatLayout>
      <ChatConversation key="new" initialMessages={[]} />
    </ChatLayout>
  );
}
