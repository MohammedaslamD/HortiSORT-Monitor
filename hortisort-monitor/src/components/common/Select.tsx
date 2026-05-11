import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Dropdown select with optional label and error display.
 * Phase B dark styling.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = '', ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-fg-4 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            block w-full rounded-md text-sm
            bg-bg-surface1 text-fg-1
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
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled className="bg-bg-surface1 text-fg-1">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-surface1 text-fg-1">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-brand-red" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
