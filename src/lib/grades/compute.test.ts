import { describe, expect, it } from "vitest"
import {
  averageOnDefaultScale,
  bandFor,
  categoryPercent,
  gradeOnScale,
  isPassing,
  subjectGrade,
  termGpa,
  withBase,
  type GradeCategory,
  type GradingScale,
} from "@/lib/grades/compute"
import { BUILT_IN_SCALE, PERCENTAGE_PRESET, PHILIPPINE_PRESET } from "@/lib/grades/presets"

function category(weight: number, scores: [number | null, number][], id = "c"): GradeCategory {
  return {
    id,
    subjectId: "s",
    name: id,
    weight,
    items: scores.map(([score, maxScore], index) => ({ id: `${id}-${index}`, name: `Item ${index}`, score, maxScore })),
  }
}

const philippine: GradingScale = { id: "ph", ...PHILIPPINE_PRESET }
const percentage: GradingScale = { id: "pct", ...PERCENTAGE_PRESET }

describe("categoryPercent", () => {
  it("ignores items that aren't graded yet", () => {
    expect(categoryPercent(category(50, [[18, 20], [null, 20]]))).toBe(90)
  })

  it("weights items by their points, not equally", () => {
    expect(categoryPercent(category(50, [[10, 10], [0, 90]]))).toBe(10)
  })

  it("is null when nothing is graded", () => {
    expect(categoryPercent(category(50, [[null, 20]]))).toBeNull()
  })
})

describe("subjectGrade", () => {
  it("scales the graded weights so they count as a full grade", () => {
    const grade = subjectGrade([category(30, [[90, 100]], "a"), category(70, [[null, 100]], "b")])
    expect(grade.percent).toBeCloseTo(90)
    expect(grade.gradedWeight).toBe(30)
    expect(grade.totalWeight).toBe(100)
  })

  it("applies category weights", () => {
    const grade = subjectGrade([category(25, [[100, 100]], "a"), category(75, [[60, 100]], "b")])
    expect(grade.percent).toBeCloseTo(70)
  })

  it("is null with no categories", () => {
    expect(subjectGrade([]).percent).toBeNull()
  })
})

describe("withBase", () => {
  it("matches the plan's base-50 formula", () => {
    expect(withBase(0, 50)).toBe(50)
    expect(withBase(80, 50)).toBe(90)
    expect(withBase(100, 50)).toBe(100)
  })

  it("leaves the percent alone with a base of 0", () => {
    expect(withBase(73.5, 0)).toBe(73.5)
  })
})

describe("bandFor", () => {
  it("uses the lowest band for anything below every cutoff", () => {
    const bands = [
      { minPercent: 60, label: "D", gradePoint: 1 },
      { minPercent: 90, label: "A", gradePoint: 4 },
    ]
    expect(bandFor(10, bands).label).toBe("D")
    expect(bandFor(90, bands).label).toBe("A")
  })
})

describe("isPassing", () => {
  it("treats a higher number as better by default", () => {
    expect(isPassing(1, BUILT_IN_SCALE)).toBe(true)
    expect(isPassing(0, BUILT_IN_SCALE)).toBe(false)
  })

  it("flips the comparison when a lower number is better", () => {
    expect(isPassing(1.25, philippine)).toBe(true)
    expect(isPassing(3, philippine)).toBe(true)
    expect(isPassing(5, philippine)).toBe(false)
  })

  it("is unknown without a grade or a passing grade", () => {
    expect(isPassing(null, philippine)).toBeNull()
    expect(isPassing(3, { higherIsBetter: true, passingGradePoint: null })).toBeNull()
  })
})

describe("gradeOnScale", () => {
  it("finds the grade on an A to F scale", () => {
    const grade = gradeOnScale([category(100, [[95, 100]])], BUILT_IN_SCALE)
    expect(grade).toMatchObject({ label: "A", gradePoint: 4, passing: true })
  })

  it("passes a high percent on a scale where lower is better", () => {
    const grade = gradeOnScale([category(100, [[98, 100]])], philippine)
    expect(grade).toMatchObject({ label: "1.00", gradePoint: 1, passing: true })
  })

  it("fails a low percent on a scale where lower is better", () => {
    const grade = gradeOnScale([category(100, [[60, 100]])], philippine)
    expect(grade).toMatchObject({ label: "5.00", gradePoint: 5, passing: false })
  })

  it("applies the base before looking up the band", () => {
    // 50 of 100 is 75% on a base of 50, which is the lowest passing grade.
    const grade = gradeOnScale([category(100, [[50, 100]])], { ...philippine, basePercent: 50 })
    expect(grade.percent).toBe(75)
    expect(grade).toMatchObject({ label: "3.00", passing: true })
  })

  it("uses the percent itself on a scale with no bands", () => {
    const grade = gradeOnScale([category(100, [[80, 100]])], percentage)
    expect(grade).toMatchObject({ label: "80.0%", gradePoint: 80, passing: true })
  })

  it("has no grade until something is graded", () => {
    expect(gradeOnScale([category(100, [[null, 100]])], BUILT_IN_SCALE)).toMatchObject({
      percent: null,
      label: null,
      gradePoint: null,
      passing: null,
    })
  })

  it("doesn't change the raw scores when switching scales", () => {
    const categories = [category(100, [[85, 100]])]
    expect(gradeOnScale(categories, BUILT_IN_SCALE).percent).toBe(gradeOnScale(categories, philippine).percent)
  })
})

describe("termGpa", () => {
  it("weights grade points by units", () => {
    expect(
      termGpa([
        { units: 3, gradePoint: 4 },
        { units: 1, gradePoint: 2 },
      ]),
    ).toBeCloseTo(3.5)
  })

  it("leaves out subjects with no grade", () => {
    expect(
      termGpa([
        { units: 3, gradePoint: 1.5 },
        { units: 3, gradePoint: null },
      ]),
    ).toBe(1.5)
  })

  it("is null when no units are counted", () => {
    expect(termGpa([{ units: 0, gradePoint: 4 }])).toBeNull()
  })
})

describe("averageOnDefaultScale", () => {
  it("leaves out and names subjects on another scale", () => {
    const result = averageOnDefaultScale(
      [
        { name: "Calculus", units: 3, gradePoint: 1.5, scaleId: "ph" },
        { name: "Exchange class", units: 3, gradePoint: 4, scaleId: "us" },
      ],
      "ph",
    )
    expect(result.average).toBe(1.5)
    expect(result.leftOut).toEqual(["Exchange class"])
  })

  it("doesn't mention subjects on another scale that have no grade yet", () => {
    const result = averageOnDefaultScale([{ name: "New", units: 3, gradePoint: null, scaleId: "us" }], "ph")
    expect(result).toEqual({ average: null, leftOut: [] })
  })
})
