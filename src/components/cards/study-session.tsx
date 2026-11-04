"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { QuizCard } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// The intervals are examples until ts-fsrs is connected.
const RATINGS = [
  { value: 1, label: "Again", interval: "<10 min" },
  { value: 2, label: "Hard", interval: "2 days" },
  { value: 3, label: "Good", interval: "4 days" },
  { value: 4, label: "Easy", interval: "8 days" },
];

export function StudySession({ deckId, deckName, cards }: { deckId: string; deckName: string; cards: QuizCard[] }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const current = queue[0];
  const finished = cards.length - new Set(queue.map((card) => card.id)).size;

  const rate = useCallback((value: number) => {
    setFlipped(false);
    setQueue(([first, ...rest]) => (value === 1 ? [...rest, first] : rest));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!current) return;
      const target = event.target as HTMLElement;
      if (event.key === " " && !target.closest("button, a")) {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (flipped && ["1", "2", "3", "4"].includes(event.key)) rate(Number(event.key));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, flipped, rate]);

  if (!current) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <CheckCircle2 className="size-12 text-chart-2" aria-hidden />
        <h1 className="mt-5 font-heading text-3xl font-semibold">{cards.length ? "All done" : "Nothing due"}</h1>
        <p className="mt-2 text-muted-foreground">
          {cards.length
            ? `You reviewed ${cards.length} ${cards.length === 1 ? "card" : "cards"} from ${deckName}.`
            : `${deckName} has no cards to review right now.`}
        </p>
        <Link href="/decks" className={cn(buttonVariants({ size: "lg" }), "mt-6 px-4")}>
          Back to quiz cards
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h1 className="truncate font-heading text-xl font-semibold">{deckName}</h1>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">
            {finished + 1} of {cards.length}
          </span>
          <Link href={`/decks/${deckId}`} aria-label="End session" className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }))}>
            <X aria-hidden />
          </Link>
        </div>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(finished / cards.length) * 100}%` }} />
      </div>

      <div className="flip-scene">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-label={flipped ? "Show question" : "Show answer"}
          data-flipped={flipped}
          className="flip-card block h-80 w-full rounded-2xl text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-96"
        >
          <span aria-hidden={flipped} className="flip-face flex flex-col rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">QUESTION</span>
            <span className="flex flex-1 items-center justify-center text-center font-heading text-2xl font-medium text-balance sm:text-3xl">
              {current.front}
            </span>
            <span className="text-center text-sm text-muted-foreground">Click or press Space to show the answer</span>
          </span>
          <span aria-hidden={!flipped} className="flip-face flip-face-back flex flex-col rounded-2xl bg-sidebar p-6 text-sidebar-accent-foreground shadow-sm sm:p-8">
            <span className="text-xs font-medium tracking-wide text-sidebar-primary">ANSWER</span>
            <span className="flex flex-1 items-center justify-center text-center font-heading text-2xl font-medium text-balance sm:text-3xl">
              {current.back}
            </span>
            <span className="text-center text-sm text-sidebar-foreground">How well did you know this?</span>
          </span>
        </button>
      </div>

      <div className="mt-6 grid min-h-16 grid-cols-2 gap-2 sm:grid-cols-4">
        {flipped ? (
          RATINGS.map((rating) => (
            <Button
              key={rating.value}
              variant={rating.value === 3 ? "default" : "outline"}
              onClick={() => rate(rating.value)}
              className="h-auto flex-col gap-0.5 py-2.5"
            >
              <span>{rating.label}</span>
              <span className="text-xs font-normal opacity-75">{rating.interval}</span>
            </Button>
          ))
        ) : (
          <Button onClick={() => setFlipped(true)} className="col-span-full h-12 text-base">
            Show answer
          </Button>
        )}
      </div>
    </div>
  );
}
