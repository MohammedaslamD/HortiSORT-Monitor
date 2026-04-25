import type { ReactNode } from 'react'

type IconTileTone = 'green' | 'red' | 'amber' | 'blue' | 'cyan' | 'purple'

interface IconTileProps {
  tone: IconTileTone
  children: ReactNode
}

const TONE: Record<IconTileTone, string> = {
  green:  'bg-brand-green/15 text-brand-green',
  red:    'bg-brand-red/15 text-brand-red',
  amber:  'bg-brand-amber/15 text-brand-amber',
  blue:   'bg-brand-cyan/15 text-brand-cyan',
  cyan:   'bg-brand-cyan/15 text-brand-cyan',
  purple: 'bg-brand-purple/15 text-brand-purple',
}

/** Square tinted tile that frames a small icon (32x32). */
export function IconTile({ tone, children }: IconTileProps) {
  return (
    <div
      className={[
        'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm',
        TONE[tone],
      ].join(' ')}
    >
      {children}
    </div>
  )
}
