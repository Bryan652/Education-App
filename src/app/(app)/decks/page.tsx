import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { DecksBrowser } from "@/components/cards/decks-browser";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";

export const metadata: Metadata = { title: "Quiz cards" };

export default function DecksPage() {
  return (
    <>
      <PageHeader
        title="Quiz cards"
        actions={
          <PreviewButton size="lg">
            <Plus aria-hidden />
            New deck
          </PreviewButton>
        }
      />
      <DecksBrowser />
    </>
  );
}
