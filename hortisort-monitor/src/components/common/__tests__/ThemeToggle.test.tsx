import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../test/utils'
import { ThemeToggle } from '../ThemeToggle'

function stubLocalStorage(): void {
  const store: Record<string, string> = {}
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { for (const k of Object.keys(store)) delete store[k] },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length },
    },
  })
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    stubLocalStorage()
    document.documentElement.classList.remove('dark')
  })

  it('shows moon icon and "Switch to dark theme" label when theme is light', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(button.querySelector('[data-testid="moon-icon"]')).toBeInTheDocument()
  })

  it('shows sun icon and "Switch to light theme" label when theme is dark', () => {
    localStorage.setItem('hortisort.theme', 'dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /switch to light theme/i })
    expect(button.querySelector('[data-testid="sun-icon"]')).toBeInTheDocument()
  })

  it('toggles theme on click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
