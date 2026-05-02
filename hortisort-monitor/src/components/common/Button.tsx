import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Visual variant of the button. */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Size of the button. */
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/40 focus:ring-blue-500',
  secondary:
    'bg-bg-surface2 text-fg-2 border border-line-strong hover:bg-bg-surface3 focus:ring-line-strong',
  danger:
    'bg-red-950 text-red-300 border border-brand-red hover:bg-red-900 focus:ring-brand-red',
  ghost:
    'bg-bg-surface3 text-fg-3 border border-line-strong hover:bg-bg-surface2 hover:text-fg-1 focus:ring-line-strong',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[10px]',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Reusable button component with variant and size support.
 * Supports loading state which disables the button and shows a spinner.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      disabled={isDisabled}
      {...rest}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
