"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { reviewCard } from "@/actions/cards";
import { Button, buttonVariants } from "@/components/ui/button";
import { intervalLabels, RATINGS, scheduleReview, type CardRating } from "@/lib/cards/scheduler";
import type { CardRecord } from "@/lib/data/cards";
import { cn } from "@/lib/utils";

const PRACTICE_BUTTONS = [
  { value: 1, label: "Again" },
  { value: 3, label: "Got it" },
] as const;

// Long cards get smaller text so they still fit on the card.
function cardTextClass(text: string) {
  return text.length > 140 ? "text-base sm:text-lg" : "text-2xl sm:text-3xl";
}

function CardText({ text }: { text: string }) {
  return (
    <span className="flex min-h-0 flex-1 overflow-y-auto py-2">
      <span className={cn("m-auto text-center font-heading font-medium wrap-anywhere text-balance whitespace-pre-wrap", cardTextClass(text))}>
        {text}
      </span>
    </span>
  );
}

interface StudySessionProps {
  deckId: string;
  deckName: string;
  // The cards due now.
  cards: CardRecord[];
  // Every card in the deck, for practicing whenever a student likes.
  allCards: CardRecord[];
  // When the next card comes due, in words, like "Tomorrow".
  nextDue: string | null;
  saves: boolean;
}

// Saving every rating refreshes the page's cards, so the session works from its own copy and isn't
// reshuffled partway through. The fresh list is only used to offer more cards at the end.
function Session({ deckId, deckName, cards, allCards, nextDue, saves }: StudySessionProps) {
  const [queue, setQueue] = useState(cards);
  const [total, setTotal] = useState(cards.length);
  const [practicing, setPracticing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [turn, setTurn] = useState(0);
  const [saving, setSaving] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date());

  const current = queue[0];
  const finished = total - new Set(queue.map((card) => card.id)).size;

  function startPractice() {
    setPracticing(true);
    setQueue(allCards);
    setTotal(allCards.length);
    setFlipped(false);
    setTurn((value) => value + 1);
  }

  const rate = useCallback(
    (rating: CardRating) => {
      if (!current) return;
      setFlipped(false);
      setTurn((value) => value + 1);

      // Practice is extra, so it never touches the review schedule or the study history.
      if (practicing) {
        setQueue(([first, ...rest]) => (rating === 1 ? [...rest, first] : rest));
        return;
      }

      setQueue(([first, ...rest]) =>
        // "Again" comes back at the end of this session, with its new state so the buttons stay right.
        rating === 1 ? [...rest, { ...first, state: scheduleReview(first.state, 1, new Date()).state }] : rest,
      );

      if (!saves) return;
      setSaving((count) => count + 1);
      reviewCard(current.id, rating)
        .then((result) => {
          if (!result.ok) toast(result.message);
        })
        .catch(() => toast("Couldn't save that rating, so the card will come up again."))
        .finally(() => setSaving((count) => count - 1));
    },
    [current, practicing, saves],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!current) return;
      const target = event.target as HTMLElement;
      if (event.key === " " && !target.closest("button, a")) {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (flipped && ["1", "2", "3", "4"].includes(event.key)) rate(Number(event.key) as CardRating);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, flipped, rate]);

  if (!current) {
    // More cards may have come due since this session started.
    const moreDue = !practicing && saves && saving === 0 ? cards.length : 0;
    const title = practicing ? "Practice done" : total ? "All done" : "Nothing due";
    const description = practicing
      ? `You practiced ${total} ${total === 1 ? "card" : "cards"} from ${deckName}.`
      : total
        ? `You reviewed ${total} ${total === 1 ? "card" : "cards"} from ${deckName}.`
        : allCards.length
          ? `${deckName} has no cards to review right now.`
          : `${deckName} doesn't have any cards yet.`;

    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <CheckCircle2 className="size-12 text-chart-2" aria-hidden />
        <h1 className="mt-5 font-heading text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        {nextDue && <p className="mt-1 text-muted-foreground">Next review: {nextDue}.</p>}
        {allCards.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            You can practice any time. It won&apos;t change your review schedule.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {moreDue > 0 && (
            <Button
              size="lg"
              className="px-4"
              onClick={() => {
                setQueue(cards);
                setTotal(cards.length);
                setStartedAt(new Date());
              }}
            >
              Study {moreDue} more
            </Button>
          )}
          {allCards.length > 0 && (
            <Button size="lg" variant={moreDue > 0 ? "outline" : "default"} className="px-4" onClick={startPractice}>
              {practicing ? "Practice again" : "Practice all cards"}
            </Button>
          )}
          <Link href={`/decks/${deckId}`} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-4")}>
            Back to deck
          </Link>
        </div>
      </div>
    );
  }

  const intervals = flipped && !practicing ? intervalLabels(current.state, startedAt) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h1 className="truncate font-heading text-xl font-semibold">{deckName}</h1>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">
            {finished + 1} of {total}
          </span>
          <Link href={`/decks/${deckId}`} aria-label="End session" className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }))}>
            <X aria-hidden />
          </Link>
        </div>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(finished / total) * 100}%` }} />
      </div>

      <div className="flip-scene">
        {/* The key starts each card fresh. Otherwise it would flip back while showing the next answer. */}
        <button
          key={turn}
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-label={flipped ? "Show question" : "Show answer"}
          data-flipped={flipped}
          className="flip-card block h-80 w-full rounded-2xl text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-96"
        >
          <span aria-hidden={flipped} className="flip-face flex flex-col rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">QUESTION</span>
            <CardText text={current.front} />
            <span className="text-center text-sm text-muted-foreground">Click or press Space to show the answer</span>
          </span>
          <span aria-hidden={!flipped} className="flip-face flip-face-back flex flex-col rounded-2xl bg-sidebar p-6 text-sidebar-accent-foreground shadow-sm ring-sidebar-border sm:p-8 dark:ring-1">
            <span className="text-xs font-medium tracking-wide text-sidebar-primary">ANSWER</span>
            <CardText text={current.back} />
            <span className="text-center text-sm text-sidebar-foreground">How well did you know this?</span>
          </span>
        </button>
      </div>

      <div className="mt-6 grid min-h-16 grid-cols-2 gap-2 sm:grid-cols-4">
        {!flipped ? (
          <Button onClick={() => setFlipped(true)} className="col-span-full h-12 text-base">
            Show answer
          </Button>
        ) : intervals ? (
          RATINGS.map((rating) => (
            <Button
              key={rating.value}
              variant={rating.value === 3 ? "default" : "outline"}
              onClick={() => rate(rating.value)}
              className="h-auto flex-col gap-0.5 py-2.5"
            >
              <span>{rating.label}</span>
              <span className="text-xs font-normal opacity-90">{intervals[rating.value]}</span>
            </Button>
          ))
        ) : (
          PRACTICE_BUTTONS.map((button) => (
            <Button
              key={button.value}
              variant={button.value === 3 ? "default" : "outline"}
              onClick={() => rate(button.value)}
              className="col-span-1 h-12 text-base sm:col-span-2"
            >
              {button.label}
            </Button>
          ))
        )}
      </div>

      {practicing && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          You&apos;re practicing, so this won&apos;t change your review schedule.
        </p>
      )}
    </div>
  );
}

/**
 * Next.js keeps visited pages alive, which would bring back a finished session when a student
 * presses Study again. This key starts a new session on each visit, while the browser's Back
 * button still returns to where they were.
 */
export function StudySession(props: StudySessionProps) {
  const { bfcacheId } = useRouter();
  return <Session key={bfcacheId} {...props} />;
}
