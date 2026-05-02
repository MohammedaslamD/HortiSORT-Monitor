import type { ReactNode } from 'react'

interface InfoBannerProps {
  children: ReactNode
}

/**
 * Cyan-tinted informational banner used at the top of pages and inside
 * modal forms. Mirrors the mockup's `info-banner` class
 * (`dark-ui-v2.html` line 168).
 */
export function InfoBanner({ children }: InfoBannerProps) {
  return (
    <div
      role="note"
      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 px-4 py-3 text-xs leading-relaxed"
    >
      {children}
    </div>
  )
}
