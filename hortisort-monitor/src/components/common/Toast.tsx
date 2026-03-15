import { useEffect } from 'react';

/** Toast notification type — determines color scheme and icon. */
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  /** Auto-dismiss duration in ms. Defaults to 4000. Set 0 to disable. */
  duration?: number;
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
};

const typeIcons: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
};

/**
 * Floating toast notification with auto-dismiss.
 * Renders at top-right of the viewport.
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
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-[100] flex items-center gap-3
        px-4 py-3 border-l-4 rounded-md shadow-lg
        animate-slide-in
        ${typeClasses[type]}
      `.trim()}
      role="alert"
    >
      <svg
        className="h-5 w-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[type]} />
      </svg>

      <p className="text-sm font-medium flex-1">{message}</p>

      <button
        onClick={onClose}
        className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
