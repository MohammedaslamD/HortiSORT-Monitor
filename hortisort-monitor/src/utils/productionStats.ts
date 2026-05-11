import type { ProductionSession, ProductionStats } from '../types'

/**
 * Pure derivation of the four ProductionPage stat-card values from today's
 * session list. No I/O, no `Date.now()` — test-friendly and deterministic.
 *
 * `rejection_rate_pct` is fixed at 0 today; `ProductionSession` does not yet
 * carry an `items_rejected` count. Phase C (or whichever chunk extends the
 * type) will replace this stub.
 */
export function computeProductionStats(sessions: ProductionSession[]): ProductionStats {
  let active = 0
  let qty = 0
  for (const s of sessions) {
    if (s.status === 'running') active++
    if (s.quantity_kg) qty += parseFloat(s.quantity_kg)
  }
  return {
    active_sessions: active,
    lots_today: sessions.length,
    items_processed_kg: Math.round(qty),
    rejection_rate_pct: 0,
  }
}
