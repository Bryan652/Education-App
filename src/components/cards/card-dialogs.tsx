"use client";

import type { ComponentProps, ReactNode } from "react";
import { createCard, createDeck, deleteCard, deleteDeck, updateCard, updateDeck } from "@/actions/cards";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { FormDialog } from "@/components/layout/form-dialog";
import { fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import type { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CARD_TEXT_MAX } from "@/lib/validation/cards";

export function DeckFormDialog({
  deck,
  subjects,
  subjectId,
  triggerProps,
  trigger,
}: {
  deck?: { id: string; name: string; subjectId: string };
  subjects: { id: string; name: string }[];
  subjectId?: string;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={deck ? "Edit deck" : "New deck"}
      description="A deck is a group of quiz cards for one subject."
      submitLabel={deck ? "Save changes" : "Create deck"}
      action={(formData) => (deck ? updateDeck(deck.id, formData) : createDeck(formData))}
      triggerProps={triggerProps}
      trigger={trigger}
    >
      {(errors) => (
        <>
          <FormField id="deck-name" label="Name" errors={errors.name}>
            <Input
              id="deck-name"
              name="name"
              defaultValue={deck?.name}
              maxLength={100}
              required
              autoFocus
              placeholder="Integration techniques"
              className="h-10"
              {...fieldA11y("deck-name", errors.name)}
            />
          </FormField>
          <FormField id="deck-subject" label="Subject" errors={errors.subject_id}>
            <NativeSelect
              id="deck-subject"
              name="subject_id"
              defaultValue={deck?.subjectId ?? subjectId}
              {...fieldA11y("deck-subject", errors.subject_id)}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteDeckButton({ deck }: { deck: { id: string; name: string; cardCount: number } }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${deck.name}`}
      visibleLabel="Delete"
      title={`Delete ${deck.name}?`}
      description={
        deck.cardCount > 0
          ? `This also deletes ${deck.cardCount === 1 ? "its card" : `its ${deck.cardCount} cards`} and their study history, and can't be undone.`
          : "This can't be undone."
      }
      action={() => deleteDeck(deck.id)}
    />
  );
}

/** Adding keeps the form open, because cards are usually written several at a time. */
export function CardFormDialog({
  deckId,
  card,
  triggerProps,
  trigger,
}: {
  deckId: string;
  card?: { id: string; front: string; back: string };
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={card ? "Edit card" : "Add cards"}
      description={
        card
          ? "Editing a card keeps its place in your review schedule."
          : "The form stays open so you can add several. Close it when you're done."
      }
      submitLabel={card ? "Save changes" : "Add card"}
      action={(formData) => (card ? updateCard(card.id, formData) : createCard(deckId, formData))}
      triggerProps={triggerProps}
      trigger={trigger}
      contentClassName="sm:max-w-lg"
      stayOpen={!card}
    >
      {(errors) => (
        <>
          <FormField id="card-front" label="Question" errors={errors.front}>
            <Textarea
              id="card-front"
              name="front"
              defaultValue={card?.front}
              maxLength={CARD_TEXT_MAX}
              required
              autoFocus
              rows={3}
              placeholder="What is the integration by parts formula?"
              {...fieldA11y("card-front", errors.front)}
            />
          </FormField>
          <FormField id="card-back" label="Answer" errors={errors.back}>
            <Textarea
              id="card-back"
              name="back"
              defaultValue={card?.back}
              maxLength={CARD_TEXT_MAX}
              required
              rows={3}
              placeholder="∫u dv = uv − ∫v du"
              {...fieldA11y("card-back", errors.back)}
            />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteCardButton({ card }: { card: { id: string; front: string } }) {
  const preview = card.front.length > 40 ? `${card.front.slice(0, 40)}…` : card.front;

  return (
    <ConfirmDeleteButton
      label={`Delete card: ${preview}`}
      title="Delete this card?"
      description={`"${preview}" and its study history will be removed. This can't be undone.`}
      action={() => deleteCard(card.id)}
    />
  );
}
