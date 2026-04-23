import type { ReactNode } from 'react';

/** Color scheme for the badge. */
type BadgeColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple';

/** Size of the badge. */
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  color?: BadgeColor;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

/**
 * Inline status badge for machine states, ticket severity, etc.
 */
export function Badge({
  color = 'gray',
  size = 'sm',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
