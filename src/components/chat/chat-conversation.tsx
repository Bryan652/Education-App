"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, FileText, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatThreads, type ChatMessage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const PREVIEW_REPLY =
  "AI isn't connected in this preview, so this is a placeholder reply. Once the chat route is set up, real answers will appear here.";

const SUGGESTIONS = [
  "Quiz me on integration by parts",
  "Summarize my cellular respiration note",
  "What should I study before Friday?",
];

export function ChatConversation({
  title,
  contextNote,
  initialMessages,
}: {
  title?: string;
  contextNote?: { id: string; title: string };
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function send(text: string) {
    const content = text.trim();
    if (!content) return;
    const id = messages.length;
    setMessages((current) => [
      ...current,
      { id: `user-${id}`, role: "user", content },
      { id: `reply-${id}`, role: "assistant", content: PREVIEW_REPLY },
    ]);
    setDraft("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  return (
    <>
      {title && (
        <header className="flex items-center gap-2 border-b p-3">
          <Link href="/chat" aria-label="All chats" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}>
            <ArrowLeft aria-hidden />
          </Link>
          <div className="min-w-0">
            <h2 className="truncate font-medium">{title}</h2>
            {contextNote && (
              <Link href={`/notes/${contextNote.id}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline">
                <FileText className="size-3 shrink-0" aria-hidden />
                <span className="truncate">Using your note: {contextNote.title}</span>
              </Link>
            )}
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">
            <Sparkles className="size-8 text-primary" aria-hidden />
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight">What are you studying?</h2>
            <p className="mt-2 text-muted-foreground">Ask a question, or get quizzed on your notes.</p>
            <div className="mt-6 flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-lg border bg-background px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="mt-6 md:hidden">
              <h3 className="text-sm font-medium text-muted-foreground">Recent chats</h3>
              <ul className="mt-2 flex flex-col gap-1">
                {chatThreads.map((thread) => (
                  <li key={thread.id}>
                    <Link href={`/chat/${thread.id}`} className="block py-1.5 text-sm font-medium hover:underline">
                      {thread.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-5">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "max-w-[85%] text-[0.9375rem] leading-relaxed whitespace-pre-wrap",
                  message.role === "user"
                    ? "self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground"
                    : "self-start",
                )}
              >
                {message.content}
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t p-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about your studies"
            aria-label="Message"
            rows={1}
            className="max-h-32 min-h-10 resize-none bg-background text-base"
          />
          <Button type="submit" size="icon-lg" className="size-10" aria-label="Send message" disabled={!draft.trim()}>
            <ArrowUp aria-hidden />
          </Button>
        </div>
      </form>
    </>
  );
}
