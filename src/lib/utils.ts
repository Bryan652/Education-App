export { cn } from "cn"

// Only allows paths inside this app, so a crafted login link can't send someone to another site.
export function safeRedirectPath(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback
  if (value.startsWith("//") || value.includes("\\")) return fallback
  return value
}

// Dates are formatted in UTC so the server and browser always show the same text.
function toUtcDate(value: string) {
  return new Date(value.length === 10 ? `${value}T00:00:00Z` : `${value}Z`)
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(toUtcDate(value))
}

export function formatClock(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const suffix = hours >= 12 ? "PM" : "AM"
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`
}

export function daysBetween(from: string, to: string) {
  const start = toUtcDate(from.slice(0, 10)).getTime()
  const end = toUtcDate(to.slice(0, 10)).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function relativeDay(today: string, value: string) {
  const days = daysBetween(today, value)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days === -1) return "Yesterday"
  if (days < 0) return `${Math.abs(days)} days ago`
  return days < 7
    ? formatDate(value, { weekday: "long" })
    : formatDate(value, { month: "short", day: "numeric" })
}
