import { render, screen } from '../../../test/utils'
import { ProductionLotTable } from '../ProductionLotTable'
import type { ProductionSession } from '../../../types'

const SESSIONS: ProductionSession[] = [
  {
    id: 1,
    machine_id: 1,
    lot_number: 1,
    session_date: '2026-04-23',
    start_time: '2026-04-23T06:00:00Z',
    stop_time: null,
    fruit_type: 'Mango',
    quantity_kg: '500.00',
    status: 'running',
    raw_tdms_rows: null,
    created_at: '2026-04-23T06:00:00Z',
    updated_at: '2026-04-23T06:00:00Z',
  },
  {
    id: 2,
    machine_id: 1,
    lot_number: 2,
    session_date: '2026-04-23',
    start_time: '2026-04-23T08:00:00Z',
    stop_time: '2026-04-23T10:00:00Z',
    fruit_type: 'Grapes',
    quantity_kg: '200.00',
    status: 'completed',
    raw_tdms_rows: null,
    created_at: '2026-04-23T08:00:00Z',
    updated_at: '2026-04-23T10:00:00Z',
  },
]

describe('ProductionLotTable', () => {
  it('renders a table with column headers', () => {
    render(<ProductionLotTable sessions={SESSIONS} />)
    expect(screen.getByText('Lot #')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Fruit Type')).toBeInTheDocument()
  })

  it('renders a row for each session', () => {
    render(<ProductionLotTable sessions={SESSIONS} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders an empty state message when sessions is empty', () => {
    render(<ProductionLotTable sessions={[]} />)
    expect(screen.getByText(/no production data/i)).toBeInTheDocument()
  })

  it('shows fruit types in the table', () => {
    render(<ProductionLotTable sessions={SESSIONS} />)
    expect(screen.getByText('Mango')).toBeInTheDocument()
    expect(screen.getByText('Grapes')).toBeInTheDocument()
  })
})
