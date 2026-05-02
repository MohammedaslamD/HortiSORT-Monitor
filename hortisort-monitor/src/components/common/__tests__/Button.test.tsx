import { render, screen } from '../../../test/utils'
import { Button } from '../Button'

describe('Button', () => {
  it('renders xs size with px-2 py-1 text-[10px]', () => {
    render(<Button size="xs" onClick={() => {}}>X</Button>)
    const btn = screen.getByRole('button', { name: 'X' })
    expect(btn.className).toMatch(/px-2/)
    expect(btn.className).toMatch(/py-1\b/)
    expect(btn.className).toMatch(/text-\[10px\]/)
  })

  it('primary variant uses Phase B blue gradient + white text', () => {
    render(<Button variant="primary" onClick={() => {}}>P</Button>)
    const btn = screen.getByRole('button', { name: 'P' })
    expect(btn.className).toMatch(/bg-gradient-to-br/)
    expect(btn.className).toMatch(/from-blue-600/)
    expect(btn.className).toMatch(/to-blue-700/)
    expect(btn.className).toMatch(/text-white/)
  })

  it('ghost variant uses Phase B surface3 + fg-3 + line-strong border', () => {
    render(<Button variant="ghost" onClick={() => {}}>G</Button>)
    const btn = screen.getByRole('button', { name: 'G' })
    expect(btn.className).toMatch(/bg-bg-surface3/)
    expect(btn.className).toMatch(/text-fg-3/)
    expect(btn.className).toMatch(/border-line-strong/)
  })
})
