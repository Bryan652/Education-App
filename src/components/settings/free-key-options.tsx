import { ExternalLink } from "lucide-react";
import { getProvider, PROVIDERS } from "@/lib/ai/providers";

const FREE_PROVIDERS = PROVIDERS.filter((provider) => provider.freeOffer);

/** Where to get a free key, for students who don't have one yet. */
export function FreeKeyOptions() {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {FREE_PROVIDERS.map((provider) => (
          <li key={provider.id}>
            <a
              href={getProvider(provider.id).keyUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium group-hover:underline">Get a free {provider.name} key</span>
                <span className="block text-xs text-muted-foreground">{provider.freeOffer}</span>
              </span>
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Free limits can change, so check each provider&apos;s site.</p>
    </div>
  );
}
