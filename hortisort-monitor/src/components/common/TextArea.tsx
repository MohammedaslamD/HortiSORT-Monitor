import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Multi-line text input with optional label, error, and helper text.
 * Phase B dark styling.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, id, className = '', rows = 3, ...rest }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-fg-4 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
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
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          {...rest}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-xs text-brand-red" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1 text-xs text-fg-4">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
