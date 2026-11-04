"use client"

import { useEffect, useState } from "react"
import { AiError, listModels, suggestedModel, type AiModel } from "@/lib/ai/client"
import { saveAiSelection, useAiKeys, useAiSelection, type AiKey } from "@/lib/ai/keys"
import { getProvider } from "@/lib/ai/providers"

interface LoadedModels {
  keyId: string
  models: AiModel[]
  error: string | null
}

/** Which key and model to use, remembering the student's last choice on this device. */
export function useModelChoice() {
  const keys = useAiKeys()
  const selection = useAiSelection()
  const key: AiKey | null = keys.find((item) => item.id === selection.keyId) ?? keys[0] ?? null
  const [loaded, setLoaded] = useState<LoadedModels | null>(null)

  useEffect(() => {
    if (!key) return
    let stale = false
    listModels(key).then(
      (models) => {
        if (!stale) setLoaded({ keyId: key.id, models, error: null })
      },
      (error: unknown) => {
        const message = error instanceof AiError ? error.message : "Couldn't load this key's models."
        if (!stale) setLoaded({ keyId: key.id, models: [], error: message })
      },
    )
    return () => {
      stale = true
    }
  }, [key])

  const current = key && loaded?.keyId === key.id ? loaded : null
  const models = current?.models ?? []
  const remembered = selection.keyId === key?.id ? models.find((item) => item.id === selection.model) : undefined
  const model = remembered ?? (key ? suggestedModel(getProvider(key.provider), models) : undefined) ?? null

  return {
    keys,
    key,
    models,
    model,
    loading: Boolean(key) && !current,
    modelsError: current?.error ?? null,
    chooseKey: (keyId: string) => saveAiSelection({ keyId, model: null }),
    chooseModel: (modelId: string) => saveAiSelection({ keyId: key?.id ?? null, model: modelId }),
  }
}

export type ModelChoice = ReturnType<typeof useModelChoice>
