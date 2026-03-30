import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../test/utils'
import { TicketSeverityChart } from '../TicketSeverityChart'
import type { Ticket } from '../../../types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
}))

const mockTickets: Ticket[] = [
  {
    id: 1, ticket_number: 'TKT-001', machine_id: 1, raised_by: 1,
    assigned_to: 2, severity: 'P1_critical', category: 'hardware',
    title: 'Critical failure', description: 'desc', status: 'open',
    sla_hours: 4, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z',
    resolved_at: null, resolution_time_mins: null, root_cause: null,
    solution: null, parts_used: null, reopen_count: 0, reopened_at: null,
    customer_rating: null, customer_feedback: null,
  },
  {
    id: 2, ticket_number: 'TKT-002', machine_id: 1, raised_by: 1,
    assigned_to: 2, severity: 'P2_high', category: 'software',
    title: 'High severity', description: 'desc', status: 'in_progress',
    sla_hours: 8, created_at: '2026-03-02T00:00:00Z', updated_at: '2026-03-02T00:00:00Z',
    resolved_at: null, resolution_time_mins: null, root_cause: null,
    solution: null, parts_used: null, reopen_count: 0, reopened_at: null,
    customer_rating: null, customer_feedback: null,
  },
]

describe('TicketSeverityChart', () => {
  it('renders the bar chart when tickets are present', () => {
    render(<TicketSeverityChart tickets={mockTickets} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders a heading label', () => {
    render(<TicketSeverityChart tickets={mockTickets} />)
    expect(screen.getByText('Ticket Severity')).toBeInTheDocument()
  })

  it('renders an empty state when no tickets are provided', () => {
    render(<TicketSeverityChart tickets={[]} />)
    expect(screen.getByText(/no tickets/i)).toBeInTheDocument()
  })
})
