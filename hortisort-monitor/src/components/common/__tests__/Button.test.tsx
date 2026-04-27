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
})
