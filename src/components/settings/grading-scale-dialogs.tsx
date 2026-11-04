"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { deleteGradingScale, saveGradingScale, setDefaultGradingScale } from "@/actions/grades";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { FormDialog } from "@/components/layout/form-dialog";
import { FieldError, fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GradingScale, ScaleBand } from "@/lib/grades/compute";
import { GRADING_PRESETS, type GradingPreset } from "@/lib/grades/presets";
import { cn } from "@/lib/utils";

type ScaleValues = Omit<GradingScale, "id">;

interface BandRow extends ScaleBand {
  key: number;
}

function BandRows({ initial, errors }: { initial: ScaleBand[]; errors?: string[] }) {
  const [rows, setRows] = useState<BandRow[]>(() => initial.map((band, key) => ({ ...band, key })));
  const [nextKey, setNextKey] = useState(initial.length);

  function addRow() {
    setRows((current) => [...current, { key: nextKey, minPercent: 0, label: "", gradePoint: null }]);
    setNextKey((key) => key + 1);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium">Grades</legend>
      <p className="mt-0.5 mb-2 text-sm text-muted-foreground">
        Each grade starts at its minimum percent. With no grades here, your grade is the percent itself.
      </p>
      {rows.length > 0 && (
        <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_2.25rem] gap-2 text-sm text-muted-foreground">
          <span>Minimum %</span>
          <span>Grade</span>
          <span>Points</span>
          <span />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_2.25rem] items-center gap-2">
            <Input
              name="band_min"
              type="number"
              min="0"
              max="100"
              step="any"
              inputMode="decimal"
              aria-label={`Minimum percent, row ${index + 1}`}
              defaultValue={row.minPercent}
              className="h-9"
            />
            <Input
              name="band_label"
              maxLength={20}
              aria-label={`Grade, row ${index + 1}`}
              defaultValue={row.label}
              className="h-9"
            />
            <Input
              name="band_point"
              type="number"
              min="0"
              max="99.99"
              step="any"
              inputMode="decimal"
              aria-label={`Grade points, row ${index + 1}`}
              defaultValue={row.gradePoint ?? undefined}
              className="h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove row ${index + 1}`}
              onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            >
              <X aria-hidden />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="mt-2" onClick={addRow}>
        <Plus aria-hidden />
        Add a grade
      </Button>
      <FieldError id="scale-bands-error" errors={errors} />
    </fieldset>
  );
}

function ScaleFields({ values, errors }: { values: ScaleValues; errors: Record<string, string[] | undefined> }) {
  return (
    <>
      <FormField id="scale-name" label="Name" errors={errors.name}>
        <Input
          id="scale-name"
          name="name"
          defaultValue={values.name}
          maxLength={100}
          required
          placeholder="My school's scale"
          className="h-10"
          {...fieldA11y("scale-name", errors.name)}
        />
      </FormField>
      <FormField id="scale-direction" label="Which number is better?" errors={errors.higher_is_better}>
        <NativeSelect id="scale-direction" name="higher_is_better" defaultValue={String(values.higherIsBetter)}>
          <option value="true">A higher number, like 4.0</option>
          <option value="false">A lower number, like 1.00</option>
        </NativeSelect>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="scale-passing"
          label="Passing grade"
          optional
          errors={errors.passing_grade_point}
        >
          <Input
            id="scale-passing"
            name="passing_grade_point"
            type="number"
            min="0"
            max="99.99"
            step="any"
            inputMode="decimal"
            defaultValue={values.passingGradePoint ?? undefined}
            className="h-10"
            {...fieldA11y("scale-passing", errors.passing_grade_point)}
          />
        </FormField>
        <FormField id="scale-average" label="Average called" errors={errors.average_label}>
          <Input
            id="scale-average"
            name="average_label"
            defaultValue={values.averageLabel}
            maxLength={20}
            required
            placeholder="GPA"
            className="h-10"
            {...fieldA11y("scale-average", errors.average_label)}
          />
        </FormField>
        <FormField id="scale-base" label="Base (%)" errors={errors.base_percent}>
          <Input
            id="scale-base"
            name="base_percent"
            type="number"
            min="0"
            max="99.99"
            step="any"
            inputMode="decimal"
            defaultValue={values.basePercent}
            className="h-10"
            {...fieldA11y("scale-base", errors.base_percent)}
          />
        </FormField>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        Some schools start every score at a base. With a base of 50, a score of 0 counts as 50%.
      </p>
      <BandRows initial={values.bands} errors={errors.bands} />
    </>
  );
}

function PresetPicker({ selected, onSelect }: { selected: GradingPreset; onSelect: (preset: GradingPreset) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Start from</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {GRADING_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            aria-pressed={preset.key === selected.key}
            onClick={() => onSelect(preset)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors hover:bg-muted",
              preset.key === selected.key && "border-primary ring-1 ring-primary",
            )}
          >
            <span className="block text-sm font-medium">{preset.name || "Custom"}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{preset.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function NewScaleDialog() {
  const [preset, setPreset] = useState(GRADING_PRESETS[0]);

  return (
    <FormDialog
      title="Add a grading scale"
      description="These are starting points, so edit anything to match your school's handbook."
      submitLabel="Add scale"
      action={(formData) => saveGradingScale(null, formData)}
      triggerProps={{ variant: "outline", className: "w-fit px-3" }}
      trigger={
        <>
          <Plus aria-hidden />
          Add scale
        </>
      }
      contentClassName="sm:max-w-xl"
    >
      {(errors) => (
        <>
          <PresetPicker selected={preset} onSelect={setPreset} />
          {/* The key resets the fields whenever a different preset is chosen. */}
          <ScaleFields key={preset.key} values={preset} errors={errors} />
        </>
      )}
    </FormDialog>
  );
}

export function EditScaleDialog({ scale }: { scale: GradingScale & { id: string } }) {
  return (
    <FormDialog
      title="Edit grading scale"
      description="Grades are calculated from your raw scores, so changing a scale doesn't lose anything."
      submitLabel="Save changes"
      action={(formData) => saveGradingScale(scale.id, formData)}
      triggerProps={{ variant: "ghost" }}
      trigger="Edit"
      contentClassName="sm:max-w-xl"
    >
      {(errors) => <ScaleFields values={scale} errors={errors} />}
    </FormDialog>
  );
}

export function MakeDefaultButton({ scaleId }: { scaleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="lg"
      className="px-3"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          toast((await setDefaultGradingScale(scaleId)).message);
        })
      }
    >
      Make default
    </Button>
  );
}

export function DeleteScaleButton({ scale }: { scale: GradingScale & { id: string } }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${scale.name}`}
      title={`Delete ${scale.name}?`}
      description="Your scores stay. Any subject using this scale switches to your default."
      action={() => deleteGradingScale(scale.id)}
    />
  );
}
