"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createDeckFromNote } from "@/actions/cards";
import { ModelPicker } from "@/components/chat/model-picker";
import { FormField } from "@/components/layout/form-field";
import { FreeKeyOptions } from "@/components/settings/free-key-options";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cardPrompt, MAX_GENERATED_CARDS, parseGeneratedCards, type GeneratedCard } from "@/lib/ai/cards";
import { AiError, streamChat } from "@/lib/ai/client";
import { fitText } from "@/lib/ai/context";
import { getProvider } from "@/lib/ai/providers";
import { useModelChoice } from "@/lib/ai/use-model-choice";

const DEFAULT_COUNT = 10;

function MakeCardsForm({
  noteId,
  noteTitle,
  noteText,
  onDone,
}: {
  noteId: string;
  noteTitle: string;
  noteText: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const choice = useModelChoice();
  const { key, model } = choice;
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [name, setName] = useState(`${noteTitle} cards`.slice(0, 100));
  const [cards, setCards] = useState<(GeneratedCard & { keep: boolean })[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const { text, truncated } = fitText(noteText);
  const provider = key ? getProvider(key.provider) : null;
  const kept = cards?.filter((card) => card.keep) ?? [];

  async function generate() {
    if (!key || !model) return;
    setGenerating(true);
    setError(null);
    const controller = new AbortController();
    abort.current = controller;

    try {
      const reply = await streamChat(key.provider, {
        key: key.key,
        model: model.id,
        maxTokens: model.maxTokens,
        system: cardPrompt(Math.min(Math.max(count, 1), MAX_GENERATED_CARDS)),
        messages: [{ role: "user", content: `<material>\n${text}\n</material>` }],
        signal: controller.signal,
        onText: () => {},
      });
      const parsed = parseGeneratedCards(reply);
      if (parsed.length === 0) {
        setError("That reply didn't contain any cards. Try again, or choose another model.");
      } else {
        setCards(parsed.map((card) => ({ ...card, keep: true })));
      }
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) {
        setError(caught instanceof AiError ? caught.message : "Couldn't make cards. Please try again.");
      }
    }
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const result = await createDeckFromNote(
      noteId,
      name,
      kept.map(({ front, back }) => ({ front, back })),
    ).catch(() => ({ ok: false as const, message: "Couldn't save these cards. Check your connection." }));
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    toast(`Added ${kept.length} ${kept.length === 1 ? "card" : "cards"} to ${name}.`);
    onDone();
    router.push(`/decks/${result.id}`);
  }

  if (choice.keys.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Add an AI key first. These are free:</p>
        <FreeKeyOptions />
        <Link href="/settings#ai-keys" className={buttonVariants({ size: "lg", className: "w-fit px-3" })}>
          Add your key
        </Link>
      </div>
    );
  }

  if (!text.trim()) {
    return <p className="text-sm text-muted-foreground">This note is empty, so there&apos;s nothing to make cards from yet.</p>;
  }

  if (cards) {
    return (
      <>
        <FormField id="cards-deck-name" label="Deck name">
          <Input
            id="cards-deck-name"
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            className="h-10"
          />
        </FormField>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Check them before saving, since AI can make mistakes</legend>
          <ul className="flex flex-col gap-2">
            {cards.map((card, index) => (
              <li key={index}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-muted p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={card.keep}
                    onChange={(event) =>
                      setCards((current) =>
                        (current ?? []).map((item, itemIndex) =>
                          itemIndex === index ? { ...item, keep: event.target.checked } : item,
                        ),
                      )
                    }
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 wrap-anywhere">
                    <span className="block font-medium whitespace-pre-wrap">{card.front}</span>
                    <span className="mt-1 block text-muted-foreground whitespace-pre-wrap">{card.back}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" size="lg" className="px-3" disabled={saving} onClick={() => setCards(null)}>
            Start over
          </Button>
          <Button size="lg" className="px-4" disabled={saving || kept.length === 0 || !name.trim()} onClick={() => void save()}>
            {saving ? "Saving…" : `Save ${kept.length} ${kept.length === 1 ? "card" : "cards"}`}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <ModelPicker choice={choice} disabled={generating} />
      <FormField id="cards-count" label="How many cards?">
        <Input
          id="cards-count"
          type="number"
          min={1}
          max={MAX_GENERATED_CARDS}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
          className="h-10 w-24"
        />
      </FormField>
      <p className="text-xs text-muted-foreground">
        Sends this note to {provider?.name}.{truncated && " It's long, so only the first part is sent."} Don&apos;t include
        anything sensitive.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        {generating ? (
          <Button variant="outline" size="lg" className="px-3" onClick={() => abort.current?.abort()}>
            Stop
          </Button>
        ) : (
          <Button size="lg" className="px-4" disabled={!model} onClick={() => void generate()}>
            <Sparkles aria-hidden />
            Make cards
          </Button>
        )}
      </DialogFooter>
      {generating && <p className="text-sm text-muted-foreground">Writing your cards…</p>}
    </>
  );
}

export function MakeCardsDialog({ noteId, noteTitle, noteText }: { noteId: string; noteTitle: string; noteText: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        <Sparkles aria-hidden />
        Make cards
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Make cards from this note</DialogTitle>
          <DialogDescription>AI writes the cards, and you choose which to keep.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <MakeCardsForm noteId={noteId} noteTitle={noteTitle} noteText={noteText} onDone={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
