import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  link?: { label: string; onClick: () => void }
  meta?: ReactNode
  children: ReactNode
}

/** Titled gradient card used as the primary content container. */
export function SectionCard({ title, link, meta, children }: SectionCardProps) {
  return (
    <section className="stat-gradient border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-wider text-fg-3 uppercase">
          {title}
        </h3>
        {link ? (
          <button
            type="button"
            onClick={link.onClick}
            className="text-xs text-brand-cyan hover:text-brand-green"
          >
            {link.label}
          </button>
        ) : meta ? (
          <span className="text-[10px] tracking-wide text-fg-4">{meta}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}
