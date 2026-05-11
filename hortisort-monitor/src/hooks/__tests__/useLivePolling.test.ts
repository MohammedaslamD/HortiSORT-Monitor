import { renderHook, act } from '@testing-library/react'
import { useLivePolling } from '../useLivePolling'

describe('useLivePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    // Restore happy-dom defaults so document accessors don't leak between tests
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible', writable: true })
    Object.defineProperty(document, 'hidden', { configurable: true, value: false, writable: true })
  })

  it('calls the fetcher once on mount and stores data', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    const { result } = renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    expect(result.current.data).toBe('init')
    await act(async () => { await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.data).toBe('A')
  })

  it('re-calls the fetcher on each interval tick', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('pauses while document.hidden = true and resumes when it becomes false', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    const visibilityState = { value: 'visible' as DocumentVisibilityState }
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilityState.value })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => visibilityState.value === 'hidden' })

    renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)

    visibilityState.value = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    await act(async () => { vi.advanceTimersByTime(5000); await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)

    visibilityState.value = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await act(async () => { await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(2) // resume triggers an immediate refetch
  })

  it('cleans up the interval on unmount', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    const { unmount } = renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    unmount()
    await act(async () => { vi.advanceTimersByTime(5000); await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('swallows fetcher errors into the error state and keeps last good data', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toBe('first')
    expect(result.current.error).toBeNull()
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve(); await Promise.resolve() })
    expect(result.current.data).toBe('first')
    expect(result.current.error).toBe('boom')
  })
})
