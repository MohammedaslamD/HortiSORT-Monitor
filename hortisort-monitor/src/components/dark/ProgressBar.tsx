type ProgressTone = 'green' | 'red' | 'amber'

interface ProgressBarProps {
  percent: number
  tone: ProgressTone
  height?: number
}

const TONE: Record<ProgressTone, string> = {
  green: 'bg-brand-green',
  red:   'bg-brand-red',
  amber: 'bg-brand-amber',
}

/** Thin horizontal progress track with a colored fill. */
export function ProgressBar({ percent, tone, height = 4 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      className="w-full bg-bg-surface3 rounded-full overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${TONE[tone]} h-full transition-all`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
