import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Optional click handler — makes the card interactive. */
  onClick?: () => void;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container card with optional header, body, and footer sections.
 * Use Card.Header, Card.Body, Card.Footer for structured layouts.
 */
export function Card({
  children,
  className = '',
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-150' : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}

function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg ${className}`}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
