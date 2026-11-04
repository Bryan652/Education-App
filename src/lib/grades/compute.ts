export interface GradeItem {
  id: string
  name: string
  score: number | null
  maxScore: number
  gradedOn?: string
}

export interface GradeCategory {
  id: string
  subjectId: string
  name: string
  weight: number
  items: GradeItem[]
}

export interface ScaleBand {
  minPercent: number
  label: string
  gradePoint: number | null
}

export interface GradingScale {
  // Null for the built-in scale used before a student has saved one of their own.
  id: string | null
  name: string
  higherIsBetter: boolean
  passingGradePoint: number | null
  averageLabel: string
  basePercent: number
  // A scale with no bands uses the percent itself as the grade.
  bands: ScaleBand[]
}

function roundWeight(weight: number) {
  return Math.round(weight * 100) / 100
}

/** Percent earned on a category's graded items, or null if nothing is graded yet. */
export function categoryPercent(category: GradeCategory) {
  const graded = category.items.filter((item) => item.score !== null)
  if (graded.length === 0) return null
  const earned = graded.reduce((sum, item) => sum + (item.score ?? 0), 0)
  const possible = graded.reduce((sum, item) => sum + item.maxScore, 0)
  return (earned / possible) * 100
}

/**
 * The grade so far. Categories with nothing graded are left out, and the remaining
 * weights are scaled so they still count as a full grade.
 */
export function subjectGrade(categories: GradeCategory[]) {
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0)
  let gradedWeight = 0
  let weightedPercent = 0

  for (const category of categories) {
    const percent = categoryPercent(category)
    if (percent === null) continue
    gradedWeight += category.weight
    weightedPercent += percent * category.weight
  }

  return {
    percent: gradedWeight === 0 ? null : weightedPercent / gradedWeight,
    // Rounded so weights like 33.3 + 33.3 + 33.4 add up to exactly 100.
    gradedWeight: roundWeight(gradedWeight),
    totalWeight: roundWeight(totalWeight),
  }
}

/** Applies a scale's base. With a base of 50, the percent is 50 + (score ÷ total × 50). */
export function withBase(percent: number, basePercent: number) {
  return basePercent + (percent * (100 - basePercent)) / 100
}

export function bandFor(percent: number, bands: ScaleBand[]) {
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent)
  return sorted.find((band) => percent >= band.minPercent) ?? sorted[sorted.length - 1]
}

/** Whether a grade point passes. Null when the scale has no passing grade or there's no grade yet. */
export function isPassing(gradePoint: number | null, scale: Pick<GradingScale, "higherIsBetter" | "passingGradePoint">) {
  if (gradePoint === null || scale.passingGradePoint === null) return null
  return scale.higherIsBetter ? gradePoint >= scale.passingGradePoint : gradePoint <= scale.passingGradePoint
}

export interface GradeResult {
  // After the scale's base is applied, so this is the number that's compared with the bands.
  percent: number | null
  gradedWeight: number
  totalWeight: number
  label: string | null
  gradePoint: number | null
  passing: boolean | null
}

/** A subject's grade on a scale. Final grades are always calculated like this, never stored. */
export function gradeOnScale(categories: GradeCategory[], scale: GradingScale): GradeResult {
  const { percent: rawPercent, gradedWeight, totalWeight } = subjectGrade(categories)
  if (rawPercent === null) {
    return { percent: null, gradedWeight, totalWeight, label: null, gradePoint: null, passing: null }
  }

  const percent = withBase(rawPercent, scale.basePercent)
  const band = scale.bands.length > 0 ? bandFor(percent, scale.bands) : null
  const gradePoint = band ? band.gradePoint : Math.round(percent * 100) / 100

  return {
    percent,
    gradedWeight,
    totalWeight,
    label: band ? band.label : `${percent.toFixed(1)}%`,
    gradePoint,
    passing: isPassing(gradePoint, scale),
  }
}

/** GPA or GWA: each grade point times its units, added up, then divided by the total units. */
export function termGpa(subjects: { units: number; gradePoint: number | null }[]) {
  const counted = subjects.filter((subject) => subject.gradePoint !== null)
  const units = counted.reduce((sum, subject) => sum + subject.units, 0)
  if (units === 0) return null
  return counted.reduce((sum, subject) => sum + (subject.gradePoint ?? 0) * subject.units, 0) / units
}

/**
 * The average on the student's default scale. Grade points from different scales can't be mixed,
 * so subjects on any other scale are left out and named, which lets the page say so.
 */
export function averageOnDefaultScale(
  subjects: { name: string; units: number; gradePoint: number | null; scaleId: string | null }[],
  defaultScaleId: string | null,
) {
  const onDefault = subjects.filter((subject) => subject.scaleId === defaultScaleId)
  return {
    average: termGpa(onDefault),
    leftOut: subjects
      .filter((subject) => subject.scaleId !== defaultScaleId && subject.gradePoint !== null)
      .map((subject) => subject.name),
  }
}
