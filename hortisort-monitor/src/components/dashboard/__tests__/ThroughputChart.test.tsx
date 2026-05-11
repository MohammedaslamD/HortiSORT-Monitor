import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../test/utils'
import { ThroughputChart } from '../ThroughputChart'
import type { DailyLog } from '../../../types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}))

const mockLogs: DailyLog[] = [
  {
    id: 1, machine_id: 1, date: '2026-03-24', status: 'running',
    fruit_type: 'Mango', tons_processed: 5.2, shift_start: '06:00',
    shift_end: '14:00', notes: '', updated_by: 2,
    created_at: '2026-03-24T06:00:00Z', updated_at: '2026-03-24T14:00:00Z',
  },
  {
    id: 2, machine_id: 2, date: '2026-03-24', status: 'running',
    fruit_type: 'Grapes', tons_processed: 3.1, shift_start: '06:00',
    shift_end: '14:00', notes: '', updated_by: 3,
    created_at: '2026-03-24T06:00:00Z', updated_at: '2026-03-24T14:00:00Z',
  },
  {
    id: 3, machine_id: 1, date: '2026-03-25', status: 'running',
    fruit_type: 'Mango', tons_processed: 6.0, shift_start: '06:00',
    shift_end: '14:00', notes: '', updated_by: 2,
    created_at: '2026-03-25T06:00:00Z', updated_at: '2026-03-25T14:00:00Z',
  },
]

describe('ThroughputChart', () => {
  it('renders the area chart when logs are present', () => {
    render(<ThroughputChart logs={mockLogs} />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renders a heading label', () => {
    render(<ThroughputChart logs={mockLogs} />)
    expect(screen.getByText(/throughput/i)).toBeInTheDocument()
  })

  it('renders an empty state when no logs are provided', () => {
    render(<ThroughputChart logs={[]} />)
    expect(screen.getByText(/no throughput data/i)).toBeInTheDocument()
  })
})
