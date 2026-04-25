interface TrendPillProps {
  direction: 'up' | 'down'
  value: string
}

/** Inline trend indicator: arrow + delta value, color-coded by direction. */
export function TrendPill({ direction, value }: TrendPillProps) {
  const arrow = direction === 'up' ? '\u25B2' : '\u25BC'
  const tone = direction === 'up' ? 'text-brand-green' : 'text-brand-red'
  return <span className={`text-xs font-semibold ${tone}`}>{arrow} {value}</span>
}
