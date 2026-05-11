interface SeverityBarProps {
  p1: number
  p2: number
  p3: number
  p4: number
}

/** Stacked severity bar with P1-P4 counts (mockup: tickets-by-severity). */
export function SeverityBar({ p1, p2, p3, p4 }: SeverityBarProps) {
  const total = p1 + p2 + p3 + p4
  const segments: Array<{ key: string; n: number; color: string }> = [
    { key: 'P1', n: p1, color: '#ef4444' },
    { key: 'P2', n: p2, color: '#fbbf24' },
    { key: 'P3', n: p3, color: '#60a5fa' },
    { key: 'P4', n: p4, color: '#94a3b8' },
  ]
  return (
    <div>
      <div className="bg-line h-6 rounded overflow-hidden flex" role="img" aria-label={`Severity totals P1=${p1} P2=${p2} P3=${p3} P4=${p4}`}>
        {segments.map((s) =>
          s.n > 0 ? (
            <div
              key={s.key}
              style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }}
              data-testid={`sev-${s.key}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-fg-4">
        {segments.map((s) => <span key={s.key}>{s.key}: {s.n}</span>)}
      </div>
    </div>
  )
}
