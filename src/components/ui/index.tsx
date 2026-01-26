/**
 * Reusable UI Components Library
 * Accessible, well-structured components for Agrisoko PWA
 */

import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// ============================================
// ERROR STATE COMPONENT (ACCESSIBLE)
// ============================================
export interface ErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorProps> = ({
  title = 'Error',
  message,
  onRetry,
  className = '',
}) => (
  <div
    className={`flex gap-3 p-4 rounded-lg bg-red-50 border border-red-200 ${className}`}
    role="alert"
    aria-live="polite"
  >
    <AlertCircle className="text-red-600 flex-shrink-0 w-5 h-5 mt-0.5" />
    <div className="flex-1">
      {title && <p className="font-semibold text-red-900">{title}</p>}
      <p className="text-red-800 text-sm mt-0.5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-700 underline hover:text-red-900 mt-2 font-medium"
          aria-label="Retry failed action"
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

// ============================================
// SUCCESS STATE COMPONENT
// ============================================
export interface SuccessProps {
  title?: string;
  message: string;
  className?: string;
}

export const SuccessAlert: React.FC<SuccessProps> = ({
  title = 'Success',
  message,
  className = '',
}) => (
  <div
    className={`flex gap-3 p-4 rounded-lg bg-green-50 border border-green-200 ${className}`}
    role="status"
    aria-live="polite"
  >
    <CheckCircle className="text-green-600 flex-shrink-0 w-5 h-5 mt-0.5" />
    <div>
      {title && <p className="font-semibold text-green-900">{title}</p>}
      <p className="text-green-800 text-sm mt-0.5">{message}</p>
    </div>
  </div>
);

// ============================================
// INFO STATE COMPONENT
// ============================================
export interface InfoProps {
  title?: string;
  message: string;
  className?: string;
}

export const InfoAlert: React.FC<InfoProps> = ({
  title,
  message,
  className = '',
}) => (
  <div
    className={`flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 ${className}`}
    role="status"
    aria-live="polite"
  >
    <Info className="text-blue-600 flex-shrink-0 w-5 h-5 mt-0.5" />
    <div>
      {title && <p className="font-semibold text-blue-900">{title}</p>}
      <p className="text-blue-800 text-sm mt-0.5">{message}</p>
    </div>
  </div>
);

// ============================================
// ACCESSIBLE BUTTON COMPONENT
// ============================================
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary:
    'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
  secondary:
    'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
  outline:
    'border-2 border-gray-300 text-gray-900 hover:border-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => (
  <button
    disabled={disabled || isLoading}
    className={`
      font-semibold rounded-lg transition-colors duration-200
      flex items-center justify-center gap-2
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
      ${buttonVariants[variant]} ${buttonSizes[size]} ${className}
      min-h-[48px] min-w-[48px]
    `}
    {...props}
  >
    {isLoading && (
      <svg
        className="animate-spin h-5 w-5"
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
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    )}
    {children}
  </button>
);

// ============================================
// SKELETON LOADER COMPONENTS
// ============================================
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between pt-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

export const SkeletonListings: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// ============================================
// EMPTY STATE COMPONENT
// ============================================
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}
  >
    {icon && <div className="flex justify-center mb-4 text-gray-300">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-gray-600 mb-6">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="text-green-600 hover:text-green-700 font-semibold transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// ============================================
// FORM GROUP COMPONENT (ACCESSIBLE)
// ============================================
export interface FormGroupProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  error,
  success,
  hint,
  required,
  children,
  id,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
    )}
    {hint && (
      <p className="text-xs text-gray-600" id={`${id}-hint`}>
        {hint}
      </p>
    )}
    {children}
    {error && (
      <p className="text-sm text-red-600 font-medium" role="alert">
        {error}
      </p>
    )}
    {success && (
      <p className="text-sm text-green-600 font-medium" role="status">
        ✓ {success}
      </p>
    )}
  </div>
);

// ============================================
// LOADING SPINNER COMPONENT
// ============================================
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', message }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <svg
        className={`animate-spin text-green-600 ${sizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

// ============================================
// ACCESSIBLE FORM INPUT
// ============================================
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, success, icon, className = '', ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        className={`
          w-full px-4 py-3 rounded-lg border-2 transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:cursor-not-allowed
          placeholder-gray-500
          ${
            error
              ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
              : success
                ? 'border-green-500 focus:border-green-600 focus:ring-green-500'
                : 'border-gray-300 focus:border-green-600 focus:ring-green-500'
          }
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</div>}
    </div>
  ),
);

Input.displayName = 'Input';
