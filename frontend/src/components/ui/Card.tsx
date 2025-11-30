import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  actions?: React.ReactNode;
  compact?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  actions,
  compact = false,
}) => {
  return (
    <div className={`card bg-base-100 shadow-xl ${compact ? 'card-compact' : ''} ${className}`}>
      <div className="card-body p-4 sm:p-6">
        {title && <h2 className="card-title text-base sm:text-lg mb-2">{title}</h2>}
        {children}
        {actions && <div className="card-actions justify-end mt-3 sm:mt-4">{actions}</div>}
      </div>
    </div>
  );
};

export default Card;
