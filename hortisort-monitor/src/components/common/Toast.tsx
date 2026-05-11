import { useEffect } from 'react'

/** Toast notification type — determines accent color and icon. */
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  isVisible: boolean
  onClose: () => void
  /** Auto-dismiss duration in ms. Defaults to 4000. Set 0 to disable. */
  duration?: number
}

const accentBorder: Record<ToastType, string> = {
  success: 'border-brand-green',
  error: 'border-brand-red',
  warning: 'border-brand-amber',
  info: 'border-brand-cyan',
}

const iconColor: Record<ToastType, string> = {
  success: 'text-brand-green',
  error: 'text-brand-red',
  warning: 'text-brand-amber',
  info: 'text-brand-cyan',
}

const typeIcons: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
}

/**
 * Floating toast notification with auto-dismiss.
 * Renders at top-right of the viewport, with a colored left accent border
 * and the gradient surface defined by the .stat-gradient utility.
 */
export function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div
      role="alert"
      className={[
        'fixed bottom-4 right-4 z-[100] flex items-center gap-3',
        'px-4 py-3 border-l-4 rounded-lg shadow-lg',
        'stat-gradient text-fg-1 animate-slide-in',
        accentBorder[type],
      ].join(' ')}
    >
      <svg
        className={`h-5 w-5 flex-shrink-0 ${iconColor[type]}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[type]} />
      </svg>

      <p className="text-sm font-medium flex-1">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-fg-3 hover:text-fg-1 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
