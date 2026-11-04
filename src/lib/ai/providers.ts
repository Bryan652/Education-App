export type ProviderId = "groq" | "gemini" | "openrouter" | "mistral" | "openai" | "anthropic" | "ollama"

export interface Provider {
  id: ProviderId
  name: string
  // Shown when adding a key, so students know where to start.
  note: string
  // For providers with a free option, shown to students who don't have a key yet.
  freeOffer?: string
  keyUrl?: string
  keyPlaceholder?: string
  // For OpenAI-compatible providers. Anthropic goes through its own SDK instead.
  baseUrl: string
  needsKey: boolean
  // The model to start on, when the provider lists one matching this.
  preferredModel?: string
}

export const PROVIDERS: Provider[] = [
  {
    id: "groq",
    name: "Groq",
    note: "Suggested first key. Has a free plan.",
    freeOffer: "Suggested first. About 1,000 requests a day.",
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_…",
    baseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    preferredModel: "gpt-oss-20b",
  },
  {
    id: "gemini",
    name: "Gemini",
    note: "Suggested second key. Has a free plan, but free content can be used to improve Google's products.",
    freeOffer: "Limits vary by model. Google can use free content to improve its products.",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza…",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    needsKey: true,
    preferredModel: "flash-lite",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    note: "Optional. Has some free models.",
    freeOffer: "Choose a model marked free. About 50 requests a day.",
    keyUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-…",
    baseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    preferredModel: ":free",
  },
  {
    id: "mistral",
    name: "Mistral",
    note: "Optional.",
    keyUrl: "https://console.mistral.ai/api-keys",
    baseUrl: "https://api.mistral.ai/v1",
    needsKey: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    note: "Optional. Paid.",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
    baseUrl: "https://api.openai.com/v1",
    needsKey: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    note: "Optional. Paid.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-…",
    baseUrl: "https://api.anthropic.com",
    needsKey: true,
    preferredModel: "claude-opus-5-5",
  },
  {
    id: "ollama",
    name: "Ollama",
    note: "Runs on your own computer with no key. Start it with OLLAMA_ORIGINS set to this site's address.",
    baseUrl: "http://localhost:11434/v1",
    needsKey: false,
  },
]

export function getProvider(id: ProviderId) {
  return PROVIDERS.find((provider) => provider.id === id) ?? PROVIDERS[0]
}

/** Every host the browser may send AI requests to. next.config.ts allows only these. */
export const PROVIDER_ORIGINS = PROVIDERS.map((provider) => new URL(provider.baseUrl).origin)
