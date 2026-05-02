import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Optional subtitle rendered under the title (Phase B mockup `.modal-sub`). */
  subtitle?: string;
  children: ReactNode;
  /** Max-width class. Defaults to 'max-w-lg'. */
  size?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl';
}

/**
 * Accessible modal dialog with backdrop overlay.
 * Closes on Escape key and backdrop click. Phase B dark shell:
 * dark surface panel, blurred 75% black backdrop, uppercase-style header.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'max-w-lg',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        data-modal-backdrop
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        data-modal-panel
        className={`
          relative bg-bg-surface2 border border-line-strong rounded-2xl shadow-2xl
          w-full mx-4 max-h-[90vh] overflow-y-auto
          ${size}
        `.trim()}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base font-bold text-fg-1">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-fg-4">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-line-strong text-fg-4 hover:text-fg-1 hover:bg-line transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
