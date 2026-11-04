"use client";

import { NativeSelect } from "@/components/layout/form-field";
import { getProvider } from "@/lib/ai/providers";
import type { ModelChoice } from "@/lib/ai/use-model-choice";

export function ModelPicker({ choice, disabled }: { choice: ModelChoice; disabled?: boolean }) {
  const { keys, key, models, model, loading, modelsError, chooseKey, chooseModel } = choice;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        aria-label="AI key"
        value={key?.id ?? ""}
        disabled={disabled}
        onChange={(event) => chooseKey(event.target.value)}
        className="h-8 w-auto max-w-full"
      >
        {keys.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({getProvider(item.provider).name})
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Model"
        value={model?.id ?? ""}
        disabled={disabled || loading || models.length === 0}
        onChange={(event) => chooseModel(event.target.value)}
        className="h-8 w-auto max-w-full min-w-32 flex-1 sm:max-w-72"
      >
        {loading && <option value="">Loading models…</option>}
        {!loading && models.length === 0 && <option value="">No models</option>}
        {models.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </NativeSelect>
      {modelsError && (
        <p role="alert" className="w-full text-xs text-destructive">
          {modelsError}
        </p>
      )}
    </div>
  );
}
