import { cache } from "react";
import { connection } from "next/server";
import { getProfile } from "@/lib/data/profile";
import type { SubjectRecord } from "@/lib/data/subjects";
import { gradeOnScale, type GradeCategory, type GradeResult, type GradingScale } from "@/lib/grades/compute";
import { BUILT_IN_SCALE } from "@/lib/grades/presets";
import { categoriesFor } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface SubjectGrade {
  grade: GradeResult;
  scale: GradingScale;
}

/** The student's own scales, and the one used by any subject that hasn't chosen its own. */
export const getGradingScales = cache(async (): Promise<{ scales: GradingScale[]; defaultScale: GradingScale }> => {
  if (!isSupabaseConfigured) return { scales: [], defaultScale: BUILT_IN_SCALE };

  await connection();
  const supabase = await createClient();
  const [{ defaultGradingScaleId }, result] = await Promise.all([
    getProfile(),
    supabase.from("grading_scales").select("*, grading_scale_bands(*)").order("created_at"),
  ]);
  if (result.error) throw new Error(`Couldn't load grading scales: ${result.error.message}`);

  const scales = result.data.map<GradingScale>((row) => ({
    id: row.id,
    name: row.name,
    higherIsBetter: row.higher_is_better,
    passingGradePoint: row.passing_grade_point,
    averageLabel: row.average_label,
    basePercent: row.base_percent,
    bands: row.grading_scale_bands
      .map((band) => ({ minPercent: band.min_percent, label: band.label, gradePoint: band.grade_point }))
      .sort((a, b) => b.minPercent - a.minPercent),
  }));

  return { scales, defaultScale: scales.find((scale) => scale.id === defaultGradingScaleId) ?? BUILT_IN_SCALE };
});

function scaleFor(subject: SubjectRecord, scales: GradingScale[], defaultScale: GradingScale) {
  return scales.find((scale) => scale.id === subject.gradingScaleId) ?? defaultScale;
}

const getCategories = cache(async (): Promise<GradeCategory[]> => {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grade_categories")
    .select("*, grade_items(*)")
    .order("created_at")
    .order("created_at", { referencedTable: "grade_items" });
  if (error) throw new Error(`Couldn't load grades: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    weight: row.weight,
    items: row.grade_items.map((item) => ({
      id: item.id,
      name: item.name,
      score: item.score,
      maxScore: item.max_score,
      gradedOn: item.graded_on ?? undefined,
    })),
  }));
});

/** Sample subjects always use the sample grades on the built-in scale. */
async function categoriesForSubjects(subjects: SubjectRecord[]) {
  const usesDatabase = isSupabaseConfigured && subjects.some((subject) => !subject.isSample);
  const stored = usesDatabase ? await getCategories() : [];

  return (subject: SubjectRecord) =>
    subject.isSample ? categoriesFor(subject.id) : stored.filter((category) => category.subjectId === subject.id);
}

export async function getSubjectGrades(subject: SubjectRecord) {
  const { scales, defaultScale } = await getGradingScales();
  const categories = (await categoriesForSubjects([subject]))(subject);
  const scale = subject.isSample ? BUILT_IN_SCALE : scaleFor(subject, scales, defaultScale);

  return { categories, scale, grade: gradeOnScale(categories, scale) };
}

/** Grades for a whole list of subjects at once, using one query. */
export async function getGradesBySubject(subjects: SubjectRecord[]) {
  const { scales, defaultScale } = await getGradingScales();
  const categoriesOf = await categoriesForSubjects(subjects);

  return new Map<string, SubjectGrade>(
    subjects.map((subject) => {
      const scale = subject.isSample ? BUILT_IN_SCALE : scaleFor(subject, scales, defaultScale);
      return [subject.id, { scale, grade: gradeOnScale(categoriesOf(subject), scale) }];
    }),
  );
}
