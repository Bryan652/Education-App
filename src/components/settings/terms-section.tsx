import { Pencil, Plus } from "lucide-react";
import { PreviewButton } from "@/components/layout/preview-button";
import { DeleteTermButton, TermFormDialog } from "@/components/settings/term-dialogs";
import { getTerms } from "@/lib/data/subjects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils";

const shortDate: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export async function TermsSection() {
  const terms = await getTerms();

  return (
    <>
      {terms.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t added any terms yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {terms.map((term) => (
            <li key={term.id} className="flex items-center gap-2 rounded-lg bg-muted py-2 pr-2 pl-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{term.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(term.startDate, shortDate)} – {formatDate(term.endDate, shortDate)}
                </p>
              </div>
              {isSupabaseConfigured && (
                <>
                  <TermFormDialog term={term} variant="ghost">
                    <Pencil aria-hidden />
                    <span className="sr-only">Edit {term.name}</span>
                  </TermFormDialog>
                  <DeleteTermButton term={term} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {isSupabaseConfigured ? (
        <TermFormDialog>
          <Plus aria-hidden />
          Add term
        </TermFormDialog>
      ) : (
        <PreviewButton variant="outline" size="lg" className="w-fit">
          <Plus aria-hidden />
          Add term
        </PreviewButton>
      )}
    </>
  );
}
