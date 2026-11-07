import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Refresh tokens are encrypted before they reach the database, so a leaked database backup
// alone can't be used to reach anyone's Google Calendar.
const VERSION = "v1";

/** The key is 32 random bytes, base64 encoded. Returns null if it's missing or the wrong size. */
export function parseTokenKey(value: string | undefined) {
  if (!value) return null;
  const key = Buffer.from(value, "base64");
  return key.length === 32 ? key : null;
}

/**
 * AES-256-GCM. The student's ID is bound in as extra authenticated data, so a token copied onto
 * another student's row won't decrypt.
 */
export function encryptToken(token: string, key: Buffer, userId: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(userId));
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), encrypted]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

/** Throws if the value was changed, belongs to someone else, or was made with another key. */
export function decryptToken(value: string, key: Buffer, userId: string) {
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== VERSION || !iv || !tag || !encrypted) throw new Error("Unrecognized token format.");

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}
