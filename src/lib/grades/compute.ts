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
  gradePoint: number
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
    gradedWeight,
    totalWeight,
  }
}

export function bandFor(percent: number, scale: ScaleBand[]) {
  const sorted = [...scale].sort((a, b) => b.minPercent - a.minPercent)
  return sorted.find((band) => percent >= band.minPercent) ?? sorted[sorted.length - 1]
}

/** GPA weighted by units. Subjects with no grade yet aren't counted. */
export function termGpa(subjects: { units: number; gradePoint: number | null }[]) {
  const counted = subjects.filter((subject) => subject.gradePoint !== null)
  const units = counted.reduce((sum, subject) => sum + subject.units, 0)
  if (units === 0) return null
  return counted.reduce((sum, subject) => sum + (subject.gradePoint ?? 0) * subject.units, 0) / units
}
