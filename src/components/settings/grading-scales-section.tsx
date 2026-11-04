import { Plus } from "lucide-react";
import { PreviewButton } from "@/components/layout/preview-button";
import {
  DeleteScaleButton,
  EditScaleDialog,
  MakeDefaultButton,
  NewScaleDialog,
} from "@/components/settings/grading-scale-dialogs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGradingScales } from "@/lib/data/grades";
import type { GradingScale } from "@/lib/grades/compute";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function hasId(scale: GradingScale): scale is GradingScale & { id: string } {
  return scale.id !== null;
}

function directionText(scale: GradingScale) {
  const passing = scale.passingGradePoint === null ? null : `Passing: ${scale.passingGradePoint}`;
  const base = scale.basePercent > 0 ? `Base ${scale.basePercent}%` : null;
  return [scale.higherIsBetter ? "Higher is better" : "Lower is better", passing, `Average: ${scale.averageLabel}`, base]
    .filter(Boolean)
    .join(" · ");
}

function BandsTable({ scale }: { scale: GradingScale }) {
  if (scale.bands.length === 0) {
    return <p className="text-sm text-muted-foreground">Your grade is the percent itself.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Grade</TableHead>
          <TableHead className="text-right">Minimum</TableHead>
          <TableHead className="text-right">Grade points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scale.bands.map((band) => (
          <TableRow key={band.minPercent}>
            <TableCell className="font-medium">{band.label}</TableCell>
            <TableCell className="text-right tabular-nums">{band.minPercent}%</TableCell>
            <TableCell className="text-right tabular-nums">
              {band.gradePoint === null ? "–" : band.gradePoint.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export async function GradingScalesSection() {
  const { scales, defaultScale } = await getGradingScales();
  const saved = scales.filter(hasId);

  return (
    <div className="flex flex-col gap-4">
      {saved.length === 0 ? (
        <>
          <div className="rounded-lg bg-muted px-3.5 py-2.5">
            <p className="text-sm font-medium">{defaultScale.name}</p>
            <p className="text-sm text-muted-foreground">
              {isSupabaseConfigured
                ? "Used until you add your school's scale."
                : directionText(defaultScale)}
            </p>
          </div>
          <BandsTable scale={defaultScale} />
        </>
      ) : (
        saved.map((scale) => {
          const isDefault = scale.id === defaultScale.id;
          return (
            <details key={scale.id} open={isDefault} className="rounded-lg bg-muted">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3.5 py-2.5 text-sm font-medium">
                {scale.name}
                {isDefault && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Default
                  </span>
                )}
              </summary>
              <div className="flex flex-col gap-3 rounded-b-lg bg-card px-3.5 py-3 ring-1 ring-muted ring-inset">
                <p className="text-sm text-muted-foreground">{directionText(scale)}</p>
                <BandsTable scale={scale} />
                <div className="flex flex-wrap items-center gap-1">
                  <EditScaleDialog scale={scale} />
                  {!isDefault && <MakeDefaultButton scaleId={scale.id} />}
                  <DeleteScaleButton scale={scale} />
                </div>
              </div>
            </details>
          );
        })
      )}

      {isSupabaseConfigured ? (
        <NewScaleDialog />
      ) : (
        <PreviewButton variant="outline" size="lg" className="w-fit">
          <Plus aria-hidden />
          Add scale
        </PreviewButton>
      )}
    </div>
  );
}
