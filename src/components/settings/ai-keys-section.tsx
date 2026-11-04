"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import { FormDialog } from "@/components/layout/form-dialog";
import { FreeKeyOptions } from "@/components/settings/free-key-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiError, testKey } from "@/lib/ai/client";
import { addAiKey, deleteAiKey, removeAllAiKeys, setForgetOnClose, useAiKeys, useForgetOnClose, type AiKey } from "@/lib/ai/keys";
import { getProvider, PROVIDERS, type ProviderId } from "@/lib/ai/providers";
import type { FormState } from "@/lib/validation/subjects";

function AddKeyDialog() {
  const [providerId, setProviderId] = useState<ProviderId>("groq");
  const provider = getProvider(providerId);

  async function save(formData: FormData): Promise<FormState> {
    const name = String(formData.get("name") ?? "").trim();
    const key = String(formData.get("key") ?? "").trim();
    const fieldErrors: Record<string, string[]> = {};
    if (!name) fieldErrors.name = ["Give this key a name."];
    if (provider.needsKey && !key) fieldErrors.key = ["Paste your key."];
    if (Object.keys(fieldErrors).length > 0) return { status: "error", fieldErrors };

    addAiKey({ name, provider: providerId, key });
    return { status: "success", message: `Added ${name}.` };
  }

  return (
    <FormDialog
      title="Add an AI key"
      description="Your key stays on this device. It never goes to this app's server, only to the provider it belongs to."
      submitLabel="Add key"
      action={save}
      triggerProps={{ variant: "outline", className: "w-fit px-3" }}
      trigger={
        <>
          <Plus aria-hidden />
          Add key
        </>
      }
    >
      {(errors) => (
        <>
          <FormField id="ai-provider" label="Provider" hint={provider.note}>
            <NativeSelect
              id="ai-provider"
              value={providerId}
              onChange={(event) => setProviderId(event.target.value as ProviderId)}
            >
              {PROVIDERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="ai-name" label="Name" errors={errors.name}>
            <Input
              id="ai-name"
              name="name"
              maxLength={50}
              required
              autoFocus
              defaultValue={provider.name}
              key={provider.id}
              className="h-10"
              {...fieldA11y("ai-name", errors.name)}
            />
          </FormField>
          {provider.needsKey && (
            <FormField
              id="ai-key"
              label="API key"
              errors={errors.key}
              hint={
                provider.keyUrl && (
                  <>
                    Get one from{" "}
                    <a href={provider.keyUrl} target="_blank" rel="noreferrer" className="underline">
                      {provider.name}
                    </a>
                    . If it&apos;s a paid key, set a spending limit there too.
                  </>
                )
              }
            >
              <Input
                id="ai-key"
                name="key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                placeholder={provider.keyPlaceholder}
                className="h-10"
                {...fieldA11y("ai-key", errors.key)}
              />
            </FormField>
          )}
        </>
      )}
    </FormDialog>
  );
}

function KeyRow({ aiKey }: { aiKey: AiKey }) {
  const provider = getProvider(aiKey.provider);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      await testKey(aiKey);
      setResult({ ok: true, message: "This key works." });
    } catch (error) {
      setResult({ ok: false, message: error instanceof AiError ? error.message : "Couldn't test this key." });
    }
    setTesting(false);
  }

  return (
    <li className="rounded-lg bg-muted py-2 pr-2 pl-3.5">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{aiKey.name}</p>
          <p className="text-sm text-muted-foreground">{provider.name}</p>
        </div>
        <Button variant="ghost" disabled={testing} onClick={() => void test()}>
          {testing ? "Testing…" : "Test"}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={`Delete ${aiKey.name}`}
          className="text-destructive hover:text-destructive"
          onClick={() => {
            deleteAiKey(aiKey.id);
            toast(`Deleted ${aiKey.name}.`);
          }}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      {result && (
        <p role="status" className="mt-1 flex items-start gap-1.5 pr-1 text-sm wrap-anywhere">
          {result.ok ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-chart-2" aria-hidden />
          ) : (
            <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          )}
          {result.message}
        </p>
      )}
    </li>
  );
}

export function AiKeysSection() {
  const keys = useAiKeys();
  const forget = useForgetOnClose();

  return (
    <div className="flex flex-col gap-3">
      {keys.length === 0 ? (
        <>
          <p className="text-sm text-muted-foreground">You haven&apos;t added any keys yet. These are free:</p>
          <FreeKeyOptions />
        </>
      ) : (
        <ul className="flex flex-col gap-2">
          {keys.map((aiKey) => (
            <KeyRow key={aiKey.id} aiKey={aiKey} />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <AddKeyDialog />
        {keys.length > 0 && (
          <Button
            variant="ghost"
            size="lg"
            className="px-3 text-destructive hover:text-destructive"
            onClick={() => {
              removeAllAiKeys();
              toast("Removed all keys from this device.");
            }}
          >
            Remove all keys
          </Button>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={forget}
          onChange={(event) => setForgetOnClose(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>
          Forget my keys when this tab closes
          <span className="block text-muted-foreground">Turn this on if you&apos;re using a shared computer.</span>
        </span>
      </label>
    </div>
  );
}
