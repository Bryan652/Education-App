// The file limits must match supabase/migrations/20261104040000_create_notes.sql, which enforces them.
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_STORAGE_BYTES = 50 * 1024 * 1024
// The database allows 500,000, but it measures with extra spacing added. Stopping sooner here means
// students get the friendly message. It also keeps saves under the 1 MB Server Action limit.
export const MAX_NOTE_BYTES = 400_000

export const NOTE_FILES_BUCKET = "note-files"

// Browsers often leave out the type for files like .md or .docx, so it's worked out from the extension.
const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

export const ALLOWED_FILE_TYPES = Object.values(FILE_TYPES)

export const FILE_INPUT_ACCEPT = Object.keys(FILE_TYPES)
  .map((extension) => `.${extension}`)
  .join(",")

export function fileTypeOf(fileName: string, browserType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? ""
  return FILE_TYPES[extension] ?? browserType
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`
}

/** Storage only accepts simple paths. The original name is kept in note_files for display. */
export function safeStorageName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[-.]+|-+$/g, "")
    .slice(-100)
  return cleaned.replace(/^[-.]+/, "") || "file"
}

/** Why a file can't be uploaded, or null if it's fine. */
export function fileProblem(file: { size: number; type: string }, usedBytes: number) {
  if (file.size === 0) return "That file is empty."
  if (file.size > MAX_FILE_BYTES) return `Files can be up to ${formatBytes(MAX_FILE_BYTES)}.`
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "That file type isn't supported. Try a PDF, image, text or Office file."
  }
  if (usedBytes + file.size > MAX_STORAGE_BYTES) {
    return `That would go over your ${formatBytes(MAX_STORAGE_BYTES)} of storage. Delete some files first.`
  }
  return null
}
