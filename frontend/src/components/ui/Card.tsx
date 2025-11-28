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
      <div className="card-body">
        {title && <h2 className="card-title">{title}</h2>}
        {children}
        {actions && <div className="card-actions justify-end">{actions}</div>}
      </div>
    </div>
  );
};

export default Card;
