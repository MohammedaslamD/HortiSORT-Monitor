import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { DataTable } from '../DataTable'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'qty', label: 'Qty', align: 'right' as const },
]

describe('DataTable', () => {
  it('renders header cells uppercase + tracking + 10px text', () => {
    render(<DataTable columns={columns} rows={[]} />)
    const nameHeader = screen.getByText('Name')
    expect(nameHeader.className).toContain('uppercase')
    expect(nameHeader.className).toMatch(/tracking-/)
    expect(nameHeader.className).toContain('text-[10px]')
  })

  it('renders all body rows', () => {
    const rows = [
      { id: 1, cells: ['Alpha', '5'] },
      { id: 2, cells: ['Beta',  '7'] },
    ]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('first body cell of each row gets fg-1 + font-semibold', () => {
    const rows = [{ id: 1, cells: ['Alpha', '5'] }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Alpha').className).toMatch(/font-semibold/)
  })

  it('right-aligns when column.align="right"', () => {
    const rows = [{ id: 1, cells: ['Alpha', '5'] }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('5').className).toContain('text-right')
  })

  it('invokes onRowClick with row id', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const rows = [{ id: 42, cells: ['Alpha', '5'] }]
    render(<DataTable columns={columns} rows={rows} onRowClick={onRowClick} />)
    await user.click(screen.getByText('Alpha'))
    expect(onRowClick).toHaveBeenCalledWith(42)
  })

  it('renders ReactNode cells', () => {
    const rows = [{ id: 1, cells: [<span key="x" data-testid="custom">custom</span>, '5'] }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByTestId('custom')).toBeInTheDocument()
  })
})
