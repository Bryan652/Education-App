import { getProvider, type Provider, type ProviderId } from "@/lib/ai/providers"

// The browser calls each provider directly, so there's no AI server route to pay for.

export interface AiCredentials {
  provider: ProviderId
  key: string
}

export interface AiModel {
  id: string
  label: string
  // Anthropic reports this. Other providers choose their own limit.
  maxTokens?: number
}

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

export type AiErrorKind = "limit" | "auth" | "network" | "other"

export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message)
    this.name = "AiError"
  }
}

const NOT_CHAT_MODEL =
  /embed|whisper|tts|speech|audio|transcri|moderation|image|dall-e|sora|realtime|guard|rerank|ocr|aqa|imagen|veo|safeguard/i

export function isChatModel(id: string) {
  return !NOT_CHAT_MODEL.test(id)
}

/** The model to start on. Whatever the student chose last takes priority over this. */
export function suggestedModel(provider: Provider, models: AiModel[]) {
  const preferred = provider.preferredModel
  return (preferred && models.find((model) => model.id.includes(preferred))) || models[0]
}

export function errorKindFor(status: number, body: string): AiErrorKind {
  if (status === 429 || status === 402) return "limit"
  if (status === 401 || status === 403) return "auth"
  // Gemini answers a bad key with a 400.
  if (status === 400 && /api[ _-]?key/i.test(body)) return "auth"
  return "other"
}

function errorMessageFrom(body: string, status: number) {
  try {
    const parsed = JSON.parse(body)
    // Gemini wraps its error in a list.
    const error = (Array.isArray(parsed) ? parsed[0] : parsed)?.error
    const message = typeof error === "string" ? error : error?.message
    if (typeof message === "string" && message) return message
  } catch {
    // Not JSON, so fall through to a plain message.
  }
  return `The provider answered with status ${status}.`
}

function networkError(provider: Provider) {
  return new AiError(
    "network",
    provider.id === "ollama"
      ? "Couldn't reach Ollama. Check it's running on this computer, with OLLAMA_ORIGINS set to this site's address."
      : `Couldn't reach ${provider.name}. Check your connection and try again.`,
  )
}

async function request(provider: Provider, path: string, key: string, init?: RequestInit) {
  let response: Response
  try {
    response = await fetch(`${provider.baseUrl}${path}`, {
      ...init,
      headers: { ...init?.headers, ...(provider.needsKey ? { Authorization: `Bearer ${key}` } : {}) },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw networkError(provider)
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new AiError(errorKindFor(response.status, body), errorMessageFrom(body, response.status))
  }
  return response
}

/** Reads a streamed response, which can split a line across any two chunks. */
export function createSseParser(onData: (data: string) => void) {
  let buffer = ""
  return (chunk: string) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data:")) continue
      const data = line.slice(5).trim()
      if (data && data !== "[DONE]") onData(data)
    }
  }
}

async function streamOpenAiCompatible(
  provider: Provider,
  { key, model, system, messages, signal, onText }: ChatRequest,
) {
  const response = await request(provider, "/chat/completions", key, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: system }, ...messages] }),
  })
  if (!response.body) throw new AiError("other", "The provider sent an empty reply.")

  let text = ""
  const parse = createSseParser((data) => {
    let event: { error?: { message?: string }; choices?: { delta?: { content?: unknown } }[] }
    try {
      event = JSON.parse(data)
    } catch {
      return
    }
    // OpenRouter can report an error partway through a reply.
    if (event.error) throw new AiError("other", event.error.message ?? "The provider stopped with an error.")
    const delta = event.choices?.[0]?.delta?.content
    if (typeof delta === "string" && delta) {
      text += delta
      onText(text)
    }
  })

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return text
      parse(value)
    }
  } catch (error) {
    if (error instanceof AiError || (error instanceof DOMException && error.name === "AbortError")) throw error
    throw networkError(provider)
  }
}

// The current models that accept the API's automatic retry on another model when one declines.
const FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"])

// Loaded only when a student has an Anthropic key, so nobody else downloads the SDK.
async function loadAnthropic(key: string) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  return { Anthropic, client: new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1 }) }
}

type AnthropicClass = Awaited<ReturnType<typeof loadAnthropic>>["Anthropic"]

function fromAnthropicError(Anthropic: AnthropicClass, error: unknown, provider: Provider) {
  if (error instanceof Anthropic.APIUserAbortError) return new DOMException("Stopped", "AbortError")
  if (error instanceof Anthropic.RateLimitError) return new AiError("limit", error.message)
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new AiError("auth", error.message)
  }
  if (error instanceof Anthropic.APIConnectionError) return networkError(provider)
  if (error instanceof Anthropic.APIError) return new AiError("other", error.message)
  return error
}

async function streamAnthropic(
  provider: Provider,
  { key, model, maxTokens, system, messages, signal, onText }: ChatRequest,
) {
  const { Anthropic, client } = await loadAnthropic(key)
  try {
    const stream = client.beta.messages.stream(
      {
        model,
        // Models differ, so stay within what this one reports.
        max_tokens: Math.min(maxTokens ?? 8192, 64000),
        system,
        messages,
        ...(FALLBACK_MODELS.has(model)
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
      },
      { signal },
    )

    let text = ""
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text
        onText(text)
      }
    }

    const final = await stream.finalMessage()
    if (final.stop_reason === "refusal" && !text) {
      throw new AiError("other", "Claude declined to answer this. Try rewording it, or choose another model.")
    }
    return text
  } catch (error) {
    throw fromAnthropicError(Anthropic, error, provider)
  }
}

export interface ChatRequest {
  key: string
  model: string
  maxTokens?: number
  system: string
  messages: ChatTurn[]
  signal?: AbortSignal
  onText: (textSoFar: string) => void
}

/** Streams a reply, calling onText as it grows, and resolves with all of it. */
export function streamChat(provider: ProviderId, chat: ChatRequest) {
  const details = getProvider(provider)
  return details.id === "anthropic" ? streamAnthropic(details, chat) : streamOpenAiCompatible(details, chat)
}

async function fetchModels(details: Provider, key: string): Promise<AiModel[]> {
  if (details.id === "anthropic") {
    const { Anthropic, client } = await loadAnthropic(key)
    try {
      const models: AiModel[] = []
      for await (const model of client.models.list({ limit: 100 })) {
        models.push({ id: model.id, label: model.display_name, maxTokens: model.max_tokens ?? undefined })
      }
      return models
    } catch (error) {
      throw fromAnthropicError(Anthropic, error, details)
    }
  }

  const response = await request(details, "/models", key)
  const body: { data?: { id?: unknown }[] } = await response.json()
  return (body.data ?? [])
    .flatMap((model) => (typeof model.id === "string" ? [model.id.replace(/^models\//, "")] : []))
    .filter(isChatModel)
    .sort()
    .map((id) => ({ id, label: id }))
}

// Asking again for the same key's models only wastes part of a free plan's limit.
const modelCache = new Map<string, Promise<AiModel[]>>()

export function listModels({ provider, key }: AiCredentials) {
  const cacheKey = `${provider}:${key}`
  const cached = modelCache.get(cacheKey)
  if (cached) return cached

  const models = fetchModels(getProvider(provider), key)
  modelCache.set(cacheKey, models)
  models.catch(() => modelCache.delete(cacheKey))
  return models
}

/** Resolves if the key works. OpenRouter lists its models for anyone, so it needs its own check. */
export async function testKey({ provider, key }: AiCredentials) {
  const details = getProvider(provider)
  if (details.id === "openrouter") {
    await request(details, "/key", key)
    return
  }
  await fetchModels(details, key)
}
