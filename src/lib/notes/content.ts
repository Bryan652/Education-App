import type { Json } from "@/types/database"

export const EMPTY_NOTE_DOC: Json = { type: "doc", content: [{ type: "paragraph" }] }

// A Tiptap document is plain nested nodes, so this only needs to see "type", "text" and "content".
interface DocNode {
  type?: unknown
  text?: unknown
  content?: unknown
}

const BLOCK_SEPARATOR = /\n{2,}/g

function textOf(node: DocNode): string {
  if (node.type === "hardBreak") return "\n"
  if (typeof node.text === "string") return node.text
  if (!Array.isArray(node.content)) return ""

  // Only text and inline nodes sit directly side by side. Blocks each go on their own line.
  const inline = node.content.every((child: DocNode) => child.type === "text" || child.type === "hardBreak")
  return node.content.map((child: DocNode) => textOf(child)).join(inline ? "" : "\n")
}

/** The text used for search and excerpts. The server works this out so it always matches the note. */
export function extractPlainText(doc: Json) {
  return textOf(doc as DocNode).replace(BLOCK_SEPARATOR, "\n").trim()
}

export function isNoteDoc(value: unknown): value is Json {
  return typeof value === "object" && value !== null && (value as DocNode).type === "doc"
}

/**
 * Builds a search that matches the start of each word, so results appear as the student types.
 * Only letters and numbers are kept, because anything else would be read as search syntax.
 */
export function toSearchQuery(input: string) {
  const words = input.match(/[\p{L}\p{N}]+/gu) ?? []
  return words.map((word) => `'${word}':*`).join(" & ")
}
