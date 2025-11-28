import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'info' | 'success' | 'warning' | 'error';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  outline?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  outline = false,
  loading = false,
  disabled,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const outlineClass = outline ? 'btn-outline' : '';
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${outlineClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
};

export default Button;
