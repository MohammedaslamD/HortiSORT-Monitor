type StatusDotTone = 'green' | 'red' | 'amber' | 'blue' | 'gray'

interface StatusDotProps {
  tone: StatusDotTone
  pulse?: boolean
}

const TONE_BG: Record<StatusDotTone, string> = {
  green: 'bg-brand-green',
  red:   'bg-brand-red',
  amber: 'bg-brand-amber',
  blue:  'bg-brand-cyan',
  gray:  'bg-fg-5',
}

/** Small status indicator dot, optionally pulsing. */
export function StatusDot({ tone, pulse = false }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        'inline-block w-1.5 h-1.5 rounded-full',
        TONE_BG[tone],
        pulse ? 'animate-pulse-dot' : '',
      ].join(' ').trim()}
    />
  )
}
