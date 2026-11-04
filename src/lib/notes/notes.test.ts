import { describe, expect, it } from "vitest"
import { EMPTY_NOTE_DOC, extractPlainText, isNoteDoc, toSearchQuery } from "@/lib/notes/content"
import { fileProblem, fileTypeOf, formatBytes, MAX_FILE_BYTES, MAX_STORAGE_BYTES, safeStorageName } from "@/lib/notes/limits"

const pdf = "application/pdf"

describe("extractPlainText", () => {
  it("puts blocks on separate lines and keeps inline text together", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", content: [{ type: "text", text: "Stages" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Net gain of " },
            { type: "text", text: "2 ATP", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Glycolysis" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Krebs" }] }] },
          ],
        },
      ],
    }
    expect(extractPlainText(doc)).toBe("Stages\nNet gain of 2 ATP\nGlycolysis\nKrebs")
  })

  it("turns line breaks into new lines", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "one" }, { type: "hardBreak" }, { type: "text", text: "two" }],
        },
      ],
    }
    expect(extractPlainText(doc)).toBe("one\ntwo")
  })

  it("is empty for an empty note", () => {
    expect(extractPlainText(EMPTY_NOTE_DOC)).toBe("")
  })
})

describe("isNoteDoc", () => {
  it("only accepts a document", () => {
    expect(isNoteDoc(EMPTY_NOTE_DOC)).toBe(true)
    expect(isNoteDoc({ type: "paragraph" })).toBe(false)
    expect(isNoteDoc("doc")).toBe(false)
    expect(isNoteDoc(null)).toBe(false)
  })
})

describe("toSearchQuery", () => {
  it("matches the start of each word", () => {
    expect(toSearchQuery("integr parts")).toBe("'integr':* & 'parts':*")
  })

  it("drops anything that would be read as search syntax", () => {
    expect(toSearchQuery("a' | b:* & !c")).toBe("'a':* & 'b':* & 'c':*")
  })

  it("keeps letters from other languages", () => {
    expect(toSearchQuery("niño 数学")).toBe("'niño':* & '数学':*")
  })

  it("is empty when there's nothing to search for", () => {
    expect(toSearchQuery(" '&! ")).toBe("")
  })
})

describe("safeStorageName", () => {
  it("keeps simple names", () => {
    expect(safeStorageName("integral-table_v2.pdf")).toBe("integral-table_v2.pdf")
  })

  it("replaces spaces and symbols", () => {
    expect(safeStorageName("Lab Report (final) #3.pdf")).toBe("Lab-Report-final-3.pdf")
  })

  it("can't climb out of its folder", () => {
    expect(safeStorageName("../../secret.pdf")).toBe("secret.pdf")
    expect(safeStorageName("a/b\\c.pdf")).toBe("a-b-c.pdf")
  })

  it("keeps the end of a long name, including the extension", () => {
    const name = safeStorageName(`${"x".repeat(300)}.pdf`)
    expect(name.length).toBeLessThanOrEqual(100)
    expect(name.endsWith(".pdf")).toBe(true)
  })

  it("always leaves something usable", () => {
    expect(safeStorageName("數學")).toBe("file")
  })
})

describe("fileProblem", () => {
  it("accepts an allowed file within the limits", () => {
    expect(fileProblem({ size: 1000, type: pdf }, 0)).toBeNull()
  })

  it("rejects files that are empty or too big", () => {
    expect(fileProblem({ size: 0, type: pdf }, 0)).toMatch(/empty/)
    expect(fileProblem({ size: MAX_FILE_BYTES + 1, type: pdf }, 0)).toMatch(/up to 10 MB/)
  })

  it("rejects file types that could run in a browser", () => {
    expect(fileProblem({ size: 1000, type: "text/html" }, 0)).toMatch(/isn't supported/)
    expect(fileProblem({ size: 1000, type: "image/svg+xml" }, 0)).toMatch(/isn't supported/)
  })

  it("rejects a file that would go over the student's storage", () => {
    expect(fileProblem({ size: 1000, type: pdf }, MAX_STORAGE_BYTES)).toMatch(/50 MB/)
    expect(fileProblem({ size: 1000, type: pdf }, MAX_STORAGE_BYTES - 1000)).toBeNull()
  })
})

describe("fileTypeOf", () => {
  it("works out the type when the browser leaves it out", () => {
    expect(fileTypeOf("Notes.MD", "")).toBe("text/markdown")
    expect(fileTypeOf("report.docx", "")).toMatch(/wordprocessingml/)
  })

  it("keeps the browser's type for anything else, so it gets rejected", () => {
    expect(fileTypeOf("page.html", "text/html")).toBe("text/html")
    expect(fileProblem({ size: 1, type: fileTypeOf("run.exe", "") }, 0)).toMatch(/isn't supported/)
  })
})

describe("formatBytes", () => {
  it("picks a readable unit", () => {
    expect(formatBytes(500)).toBe("500 B")
    expect(formatBytes(240 * 1024)).toBe("240 KB")
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB")
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB")
  })
})
