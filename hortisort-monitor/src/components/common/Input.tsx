import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Form input with optional label, error, and helper text.
 * Phase B dark styling: dark surface, uppercase label, brand-cyan focus ring.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-fg-4 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full rounded-md text-sm
            bg-bg-surface1 text-fg-1 placeholder-fg-5
            disabled:bg-bg-surface2 disabled:text-fg-4
            focus:outline-none focus:ring-2
            ${
              error
                ? 'border border-brand-red focus:ring-brand-red/20'
                : 'border border-line-strong focus:border-brand-cyan focus:ring-brand-cyan/20'
            }
            ${className}
          `.trim()}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-brand-red" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-fg-4">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
