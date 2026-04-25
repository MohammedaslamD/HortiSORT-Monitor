import type { ThroughputPoint } from '../../types'

interface SparklineProps {
  points: ThroughputPoint[]
  height?: number
}

const W = 340
const H = 140

/**
 * Hand-rolled SVG sparkline matching dark-ui-v2.html "Live Throughput".
 * Two series: solid cyan actual + dashed green target, plus actual-fill gradient.
 * `points` first->last is left->right time axis; rightmost point gets the pulsing dot.
 */
export function Sparkline({ points, height = 140 }: SparklineProps) {
  if (points.length === 0) {
    return <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} />
  }
  const max = Math.max(...points.flatMap((p) => [p.actual, p.target]), 1)
  const min = 0
  const xStep = W / (points.length - 1 || 1)
  const yScale = (v: number) => H - ((v - min) / (max - min)) * (H - 10) - 5

  const actualD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${yScale(p.actual)}`).join(' ')
  const targetD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${yScale(p.target)}`).join(' ')
  const fillD = `${actualD} L${W},${H} L0,${H} Z`
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 70, 110].map((y) => (
        <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgb(var(--line))" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      <path d={fillD} fill="url(#sparkline-fill)" />
      <path d={actualD} fill="none" stroke="#38bdf8" strokeWidth="2" />
      <path d={targetD} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,3" />
      <circle cx={(points.length - 1) * xStep} cy={yScale(last.actual)} r="4" fill="#38bdf8" />
      <circle cx={(points.length - 1) * xStep} cy={yScale(last.actual)} r="9" fill="#38bdf8" opacity="0.2" className="animate-pulse-dot" />
    </svg>
  )
}
