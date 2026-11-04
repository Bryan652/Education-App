"use client";

import { useEffect, useEffectEvent, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, FileText, KeyRound, Sparkles, Square } from "lucide-react";
import { addChatMessage, createChatThread, deleteChatThread } from "@/actions/chat";
import { ModelPicker } from "@/components/chat/model-picker";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { NativeSelect } from "@/components/layout/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiError, streamChat, type AiErrorKind } from "@/lib/ai/client";
import { buildSystemPrompt, recentHistory, type ChatContext } from "@/lib/ai/context";
import { getProvider } from "@/lib/ai/providers";
import { useModelChoice } from "@/lib/ai/use-model-choice";
import type { ThreadMessage, ThreadSummary } from "@/lib/data/chat";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Quiz me on this", "Summarize the main ideas", "Explain the hardest part simply"];

export interface ContextOptions {
  subjects: { id: string; name: string }[];
  notes: { id: string; title: string }[];
}

interface LocalMessage extends ThreadMessage {
  // Set once the server has it. It's then replaced by the saved copy when the page refreshes.
  savedId?: string;
}

// A new chat saves its first message, then opens its own page. That page asks for the reply.
let replyWanted: string | null = null;

function wantReply(threadId: string) {
  replyWanted = threadId;
}

function takeWantedReply(threadId: string) {
  if (replyWanted !== threadId) return false;
  replyWanted = null;
  return true;
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function Bubble({ role, children }: { role: ThreadMessage["role"]; children: string }) {
  return (
    <li
      className={cn(
        "max-w-[85%] text-[0.9375rem] leading-relaxed wrap-anywhere whitespace-pre-wrap",
        role === "user"
          ? "self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground"
          : "self-start",
      )}
    >
      {children}
    </li>
  );
}

export function ChatConversation({
  threadId,
  title,
  context,
  messages: savedMessages,
  saves,
  recentThreads,
  contextOptions,
}: {
  threadId?: string;
  title?: string;
  context: ChatContext | null;
  messages: ThreadMessage[];
  // False in the preview, where a chat lasts until the page closes.
  saves: boolean;
  recentThreads?: ThreadSummary[];
  contextOptions?: ContextOptions;
}) {
  const router = useRouter();
  const choice = useModelChoice();
  const { key, keys, model, loading: modelsLoading } = choice;
  const provider = key ? getProvider(key.provider) : null;

  const [local, setLocal] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<{ kind: AiErrorKind; message: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages: ThreadMessage[] = [
    ...savedMessages,
    ...local.filter((message) => !savedMessages.some((saved) => saved.id === message.savedId)),
  ];
  const busy = streaming !== null || starting;
  const lastIsStudent = messages.at(-1)?.role === "user";
  const { leftOut } = recentHistory(messages);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streaming]);

  async function saveLocally(role: ThreadMessage["role"], content: string) {
    const id = crypto.randomUUID();
    setLocal((current) => [...current, { id, role, content }]);
    if (!saves || !threadId) return true;

    const result = await addChatMessage(threadId, role, content).catch(() => ({
      ok: false as const,
      message: "Couldn't save this message. Check your connection.",
    }));
    if (result.ok) {
      setLocal((current) => current.map((item) => (item.id === id ? { ...item, savedId: result.id } : item)));
      return true;
    }
    setError({ kind: "other", message: result.message });
    return false;
  }

  async function reply(history: ThreadMessage[]) {
    if (!key || !model) return;
    setError(null);
    setStreaming("");
    const controller = new AbortController();
    abort.current = controller;

    let text = "";
    try {
      text = await streamChat(key.provider, {
        key: key.key,
        model: model.id,
        maxTokens: model.maxTokens,
        system: buildSystemPrompt(context),
        messages: recentHistory(history.map(({ role, content }) => ({ role, content }))).messages,
        signal: controller.signal,
        onText: (soFar) => {
          text = soFar;
          setStreaming(soFar);
        },
      });
    } catch (caught) {
      // Whatever arrived before stopping is still worth keeping.
      if (!isAbort(caught)) {
        setError(
          caught instanceof AiError
            ? { kind: caught.kind, message: caught.message }
            : { kind: "other", message: "Something went wrong while getting a reply." },
        );
      }
    }

    abort.current = null;
    setStreaming(null);
    if (text.trim()) await saveLocally("assistant", text);
  }

  // Waits until the models have loaded, because the reply needs one.
  const startWantedReply = useEffectEvent(() => {
    if (threadId && takeWantedReply(threadId)) void reply(savedMessages);
  });
  useEffect(() => {
    if (!model) return;
    const timer = setTimeout(startWantedReply, 0);
    return () => clearTimeout(timer);
  }, [model]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !key || !model) return;
    setDraft("");
    setError(null);

    if (saves && !threadId) {
      setStarting(true);
      const result = await createChatThread({
        message: content,
        subject_id: context?.kind === "subject" ? context.id : "",
        note_id: context?.kind === "note" ? context.id : "",
      }).catch(() => ({ ok: false as const, message: "Couldn't start this chat. Check your connection." }));
      setStarting(false);

      if (!result.ok) {
        setDraft(content);
        setError({ kind: "other", message: result.message });
        return;
      }
      wantReply(result.id);
      router.push(`/chat/${result.id}`);
      return;
    }

    const saved = await saveLocally("user", content);
    if (!saved) return;
    await reply([...messages, { id: "new", role: "user", content }]);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  }

  function chooseContext(value: string) {
    const [kind, id] = value.split(":");
    router.replace(kind && id ? `/chat?${kind}=${id}` : "/chat", { scroll: false });
  }

  const contextName = context && `your ${context.kind} "${context.name}"`;

  return (
    <>
      {title && (
        <header className="flex items-center gap-2 border-b p-3">
          <Link href="/chat" aria-label="All chats" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}>
            <ArrowLeft aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-medium">{title}</h2>
            {context && (
              <Link
                href={context.kind === "note" ? `/notes/${context.id}` : `/subjects/${context.id}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
              >
                <FileText className="size-3 shrink-0" aria-hidden />
                <span className="truncate">
                  Using your {context.kind}: {context.name}
                </span>
              </Link>
            )}
          </div>
          {saves && threadId && (
            <ConfirmDeleteButton
              label="Delete this chat"
              title="Delete this chat?"
              description="Its messages will be removed. This can't be undone."
              action={() => deleteChatThread(threadId)}
            />
          )}
        </header>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 && !starting ? (
          <div className="mx-auto flex min-h-full max-w-md flex-col justify-center">
            <Sparkles className="size-8 text-primary dark:text-highlight" aria-hidden />
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight">What are you studying?</h2>
            <p className="mt-2 text-muted-foreground">
              {context ? `Ask anything about ${context.name}.` : "Ask a question, or choose a note to study from."}
            </p>

            {contextOptions && (
              <NativeSelect
                aria-label="What to study from"
                value={context ? `${context.kind}:${context.id}` : ""}
                onChange={(event) => chooseContext(event.target.value)}
                className="mt-4"
              >
                <option value="">No note or subject</option>
                {contextOptions.notes.length > 0 && (
                  <optgroup label="Notes">
                    {contextOptions.notes.map((note) => (
                      <option key={note.id} value={`note:${note.id}`}>
                        {note.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {contextOptions.subjects.length > 0 && (
                  <optgroup label="Subjects">
                    {contextOptions.subjects.map((subject) => (
                      <option key={subject.id} value={`subject:${subject.id}`}>
                        {subject.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </NativeSelect>
            )}

            {context && key && (
              <div className="mt-4 flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={!model}
                    onClick={() => void send(suggestion)}
                    className="rounded-lg border bg-background px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {recentThreads && recentThreads.length > 0 && (
              <div className="mt-6 md:hidden">
                <h3 className="text-sm font-medium text-muted-foreground">Recent chats</h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {recentThreads.map((thread) => (
                    <li key={thread.id}>
                      <Link href={`/chat/${thread.id}`} className="block py-1.5 text-sm font-medium hover:underline">
                        {thread.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-5">
            {messages.map((message) => (
              <Bubble key={message.id} role={message.role}>
                {message.content}
              </Bubble>
            ))}
            {streaming !== null &&
              (streaming ? (
                <Bubble role="assistant">{streaming}</Bubble>
              ) : (
                <li className="self-start text-sm text-muted-foreground">Thinking…</li>
              ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div role="alert" className="mx-auto w-full max-w-2xl px-3 pb-2 text-sm">
          <div className="rounded-lg bg-muted px-3 py-2.5">
            <p className="font-medium text-destructive">
              {error.kind === "limit" && key
                ? `Your ${provider?.name} key "${key.name}" has run out for now.`
                : error.kind === "auth" && key
                  ? `Your ${provider?.name} key "${key.name}" didn't work.`
                  : "That didn't work."}
            </p>
            <p className="mt-0.5 text-muted-foreground wrap-anywhere">{error.message}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {keys
                .filter((item) => item.id !== key?.id)
                .map((item) => (
                  <Button key={item.id} variant="outline" onClick={() => choice.chooseKey(item.id)}>
                    Switch to {item.name}
                  </Button>
                ))}
              {error.kind === "auth" && (
                <Link href="/settings" className={buttonVariants({ variant: "outline" })}>
                  Check your keys
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="border-t p-4">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="size-4 shrink-0" aria-hidden />
              Add an AI key to start chatting. Groq and Gemini both have free plans.
            </p>
            <Link href="/settings" className={buttonVariants({ size: "lg", className: "px-3" })}>
              Add a key
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t p-3">
          <div className="mx-auto w-full max-w-2xl">
            <ModelPicker choice={choice} disabled={busy} />
            {lastIsStudent && !busy && model && !error && replyWanted !== threadId && (
              <Button type="button" variant="outline" className="mt-2" onClick={() => void reply(messages)}>
                Get a reply
              </Button>
            )}
            {lastIsStudent && !busy && model && error && (
              <Button type="button" variant="outline" className="mt-2" onClick={() => void reply(messages)}>
                Try again
              </Button>
            )}
          </div>
          <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about your studies"
              aria-label="Message"
              rows={1}
              className="max-h-32 min-h-10 resize-none bg-background text-base"
            />
            {streaming !== null ? (
              <Button type="button" size="icon-lg" className="size-10" aria-label="Stop" onClick={() => abort.current?.abort()}>
                <Square aria-hidden />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-lg"
                className="size-10"
                aria-label="Send message"
                disabled={!draft.trim() || busy || !model || modelsLoading}
              >
                <ArrowUp aria-hidden />
              </Button>
            )}
          </div>
          {/* Students should always know where their words are going. */}
          <p className="mx-auto w-full max-w-2xl text-xs text-muted-foreground">
            Sends your messages{contextName ? ` and ${contextName}` : ""} to {provider?.name}.
            {context?.truncated && ` It's long, so only the first part is sent.`}
            {leftOut > 0 && ` Older messages aren't sent, to stay within your limit.`}
            {" "}Don&apos;t include anything sensitive.
          </p>
        </form>
      )}
    </>
  );
}
