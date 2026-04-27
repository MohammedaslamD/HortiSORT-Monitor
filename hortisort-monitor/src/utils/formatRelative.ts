/**
 * Formats an ISO timestamp as a relative time string ("just now", "Xm ago",
 * "Xh ago", "Xd ago"). Used across dashboard and machines views to render
 * `last_active` and similar fields.
 */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
