import React from 'react';

function classNames(list) {
  return list.filter(Boolean).join(' ');
}

const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-neutral-600 text-white hover:bg-neutral-700',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-neutral-500 text-gray-200 hover:bg-white/10',
  ghost: 'text-neutral-400 hover:text-neutral-300',
};

const sizeClasses = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-base',
  lg: 'h-12 text-lg',
};

const baseClasses = 'w-full inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:bg-neutral-500 disabled:text-gray-400 disabled:cursor-not-allowed';

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  size = 'md',
  ...props
}) {
  const styles = classNames([baseClasses, sizeClasses[size], variantClasses[variant], className]);
  return (
    <button type={type} className={styles} {...props}>
      {children}
    </button>
  );
}

export default Button;


