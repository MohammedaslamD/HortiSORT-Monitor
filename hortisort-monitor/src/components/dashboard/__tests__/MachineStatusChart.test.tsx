import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../test/utils'
import { MachineStatusChart } from '../MachineStatusChart'
import type { MachineStats } from '../../../types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

const fullStats: MachineStats = { total: 12, running: 7, idle: 2, down: 2, offline: 1 }
const emptyStats: MachineStats = { total: 0, running: 0, idle: 0, down: 0, offline: 0 }

describe('MachineStatusChart', () => {
  it('renders the pie chart when data is present', () => {
    render(<MachineStatusChart stats={fullStats} />)
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('renders a heading label', () => {
    render(<MachineStatusChart stats={fullStats} />)
    expect(screen.getByText('Machine Status')).toBeInTheDocument()
  })

  it('renders an empty state message when total is zero', () => {
    render(<MachineStatusChart stats={emptyStats} />)
    expect(screen.getByText(/no machines/i)).toBeInTheDocument()
  })
})
