import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from '../ThemeContext'

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('ThemeContext', () => {
  beforeEach(() => {
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
    document.documentElement.classList.remove('dark')
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to light when no storage and system is light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('defaults to dark when system prefers dark and no storage', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
  })

  it('prefers localStorage value over system preference', () => {
    mockMatchMedia(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('toggleTheme flips light to dark and back', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('dark')
    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('light')
  })

  it('setTheme("dark") adds dark class to documentElement', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.setTheme('dark') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme("light") removes dark class from documentElement', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.setTheme('light') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme persists to localStorage under hortisort.theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.setTheme('dark') })
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('reacts to storage events from another tab', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'dark',
      }))
    })
    expect(result.current.theme).toBe('dark')
  })

  it('useTheme throws when used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTheme())).toThrow(
      /useTheme must be used within a ThemeProvider/,
    )
    spy.mockRestore()
  })
})
