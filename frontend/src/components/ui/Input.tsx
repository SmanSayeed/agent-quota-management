import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  bordered?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', bordered = true, ...props }, ref) => {
    return (
      <div className="form-control w-full">
        {label && (
          <label className="label pb-1">
            <span className="label-text text-xs sm:text-sm font-medium">{label}</span>
          </label>
        )}
        <input
          ref={ref}
          className={`input ${bordered ? 'input-bordered' : ''} ${
            error ? 'input-error' : ''
          } w-full min-h-[2.75rem] text-sm sm:text-base ${className}`}
          {...props}
        />
        {error && (
          <label className="label pt-1">
            <span className="label-text-alt text-error text-xs">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
