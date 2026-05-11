import type { ReactNode } from 'react'

interface ColumnDef {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface RowDef {
  id: string | number
  cells: ReactNode[]
}

interface DataTableProps {
  columns: ColumnDef[]
  rows: RowDef[]
  onRowClick?: (id: string | number) => void
}

const alignClass = (align: ColumnDef['align']): string => {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

/** Dense dark table primitive. Header uppercase 10px; first-col emphasized. */
export function DataTable({ columns, rows, onRowClick }: DataTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line/40">
          {columns.map((col) => (
            <th
              key={col.key}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-fg-6 ${alignClass(col.align)}`}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={`border-b border-line/40 hover:bg-bg-surface3 ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={onRowClick ? () => onRowClick(row.id) : undefined}
          >
            {row.cells.map((cell, idx) => (
              <td
                key={idx}
                className={`px-3 py-2 ${alignClass(columns[idx]?.align)} ${idx === 0 ? 'text-fg-1 font-semibold' : 'text-fg-3'}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
