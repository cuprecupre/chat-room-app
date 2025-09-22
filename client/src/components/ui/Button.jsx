import React from 'react';

function classNames(list) {
  return list.filter(Boolean).join(' ');
}

const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-gray-500 text-gray-200 hover:bg-white/10',
  ghost: 'text-gray-400 hover:text-gray-300',
};

const baseClasses = 'w-full h-11 inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed';

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const styles = classNames([baseClasses, variantClasses[variant], className]);
  return (
    <button type={type} className={styles} {...props}>
      {children}
    </button>
  );
}

export default Button;


