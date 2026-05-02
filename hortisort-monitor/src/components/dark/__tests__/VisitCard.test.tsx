import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/utils'

import { VisitCard } from '../VisitCard'
import { StatBadge } from '../StatBadge'

describe('VisitCard', () => {
  const baseProps = {
    title: 'M-003 Pomegranate A — Emergency Repair',
    meta: 'Amit Sharma · Today 10:30 · Linked to TK-0041',
    purposeBadge: <StatBadge variant="emergency">Emergency</StatBadge>,
    findings: 'Motor bearing worn out.',
    actions: 'Replaced motor bearing (MB-4412).',
    partsReplaced: 'Motor bearing MB-4412 ×1',
    nextVisitDue: '23 May 2026',
  }

  it('renders title and meta line', () => {
    render(<VisitCard {...baseProps} />)
    expect(screen.getByText(baseProps.title)).toBeInTheDocument()
    expect(screen.getByText(baseProps.meta)).toBeInTheDocument()
  })

  it('renders the badge passed via purposeBadge slot', () => {
    render(<VisitCard {...baseProps} />)
    expect(screen.getByText('Emergency')).toBeInTheDocument()
  })

  it('renders Findings and Actions in body section', () => {
    render(<VisitCard {...baseProps} />)
    expect(screen.getByText(/Findings:/i)).toBeInTheDocument()
    expect(screen.getByText(/Motor bearing worn out\./)).toBeInTheDocument()
    expect(screen.getByText(/Actions:/i)).toBeInTheDocument()
    expect(screen.getByText(/Replaced motor bearing/)).toBeInTheDocument()
  })

  it('renders Parts Replaced and Next Visit Due in stats footer', () => {
    render(<VisitCard {...baseProps} />)
    expect(screen.getByText(/PARTS REPLACED/i)).toBeInTheDocument()
    expect(screen.getByText('Motor bearing MB-4412 ×1')).toBeInTheDocument()
    expect(screen.getByText(/NEXT VISIT DUE/i)).toBeInTheDocument()
    expect(screen.getByText('23 May 2026')).toBeInTheDocument()
  })
})
