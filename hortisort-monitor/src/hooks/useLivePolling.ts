import { useEffect, useRef, useState } from 'react'

interface PollingState<T> {
  data: T
  loading: boolean
  error: string | null
}

/**
 * Polls `fetcher` immediately on mount and every `intervalMs` thereafter.
 * Pauses when `document.hidden`; resumes (with an immediate refetch) when visible.
 * Errors are swallowed into `error` state; last-good `data` is preserved.
 *
 * @param fetcher  async function returning the polled value
 * @param intervalMs poll cadence in milliseconds
 * @param initial  initial value of `data` before the first fetch resolves
 */
export function useLivePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  initial: T,
): PollingState<T> {
  const [state, setState] = useState<PollingState<T>>({ data: initial, loading: true, error: null })
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function tick() {
      try {
        const data = await fetcherRef.current()
        if (cancelled) return
        setState({ data, loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Polling failed'
        setState((prev) => ({ ...prev, loading: false, error: msg }))
      }
    }

    function start() {
      if (timer !== null) return
      void tick()
      timer = setInterval(() => { void tick() }, intervalMs)
    }
    function stop() {
      if (timer !== null) { clearInterval(timer); timer = null }
    }

    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])

  return state
}
