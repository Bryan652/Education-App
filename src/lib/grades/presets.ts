import type { GradingScale } from "@/lib/grades/compute"

export interface GradingPreset extends Omit<GradingScale, "id"> {
  key: string
  description: string
}

// Starting points only. Cutoffs differ even between schools in one country, so every
// preset is copied into the student's own scale, which they can edit to match their handbook.
export const A_TO_F_PRESET: GradingPreset = {
  key: "a-to-f",
  name: "A to F (4.0)",
  description: "A is best, and a higher number is better.",
  higherIsBetter: true,
  passingGradePoint: 1,
  averageLabel: "GPA",
  basePercent: 0,
  bands: [
    { minPercent: 93, label: "A", gradePoint: 4 },
    { minPercent: 90, label: "A−", gradePoint: 3.7 },
    { minPercent: 87, label: "B+", gradePoint: 3.3 },
    { minPercent: 83, label: "B", gradePoint: 3 },
    { minPercent: 80, label: "B−", gradePoint: 2.7 },
    { minPercent: 77, label: "C+", gradePoint: 2.3 },
    { minPercent: 73, label: "C", gradePoint: 2 },
    { minPercent: 70, label: "C−", gradePoint: 1.7 },
    { minPercent: 60, label: "D", gradePoint: 1 },
    { minPercent: 0, label: "F", gradePoint: 0 },
  ],
}

export const PHILIPPINE_PRESET: GradingPreset = {
  key: "philippine",
  name: "Philippine (1.00 to 5.00)",
  description: "1.00 is best, and a lower number is better.",
  higherIsBetter: false,
  passingGradePoint: 3,
  averageLabel: "GWA",
  basePercent: 0,
  bands: [
    { minPercent: 97, label: "1.00", gradePoint: 1 },
    { minPercent: 94, label: "1.25", gradePoint: 1.25 },
    { minPercent: 91, label: "1.50", gradePoint: 1.5 },
    { minPercent: 88, label: "1.75", gradePoint: 1.75 },
    { minPercent: 85, label: "2.00", gradePoint: 2 },
    { minPercent: 82, label: "2.25", gradePoint: 2.25 },
    { minPercent: 79, label: "2.50", gradePoint: 2.5 },
    { minPercent: 76, label: "2.75", gradePoint: 2.75 },
    { minPercent: 75, label: "3.00", gradePoint: 3 },
    { minPercent: 0, label: "5.00", gradePoint: 5 },
  ],
}

export const PERCENTAGE_PRESET: GradingPreset = {
  key: "percentage",
  name: "Percentage",
  description: "Your grade is the percent itself, with 100% as the best.",
  higherIsBetter: true,
  passingGradePoint: 75,
  averageLabel: "Average",
  basePercent: 0,
  bands: [],
}

export const CUSTOM_PRESET: GradingPreset = {
  key: "custom",
  name: "",
  description: "Start from scratch and set everything yourself.",
  higherIsBetter: true,
  passingGradePoint: null,
  averageLabel: "Average",
  basePercent: 0,
  bands: [{ minPercent: 0, label: "", gradePoint: null }],
}

export const GRADING_PRESETS = [A_TO_F_PRESET, PHILIPPINE_PRESET, PERCENTAGE_PRESET, CUSTOM_PRESET]

// Used until a student saves a scale of their own, so grades work from the start.
export const BUILT_IN_SCALE: GradingScale = {
  id: null,
  name: A_TO_F_PRESET.name,
  higherIsBetter: A_TO_F_PRESET.higherIsBetter,
  passingGradePoint: A_TO_F_PRESET.passingGradePoint,
  averageLabel: A_TO_F_PRESET.averageLabel,
  basePercent: A_TO_F_PRESET.basePercent,
  bands: A_TO_F_PRESET.bands,
}
