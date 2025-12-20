import React from "react";

function classNames(list) {
    return list.filter(Boolean).join(" ");
}

const variantClasses = {
    primary: "bg-orange-700 text-white hover:bg-orange-800 active:bg-orange-900",
    secondary: "bg-neutral-600 text-white hover:bg-neutral-700 active:bg-neutral-800",
    danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
    outline: "border border-neutral-500 text-neutral-200 hover:bg-white/10 active:bg-white/20",
    ghost: "text-neutral-400 hover:text-neutral-300 hover:bg-white/10 active:text-neutral-200 active:bg-white/5",
};

const sizeClasses = {
    sm: "h-9 text-sm px-4",
    md: "h-11 text-base px-6",
    lg: "h-12 text-lg px-8",
};

const baseClasses =
    "w-full inline-flex items-center justify-center rounded-3xl font-semibold transition-all duration-150 active:scale-95 touch-manipulation focus:outline-none ring-1 ring-transparent focus-visible:ring-white/20 disabled:bg-neutral-500 disabled:text-neutral-400 disabled:cursor-not-allowed";

export function Button({
    children,
    variant = "primary",
    className = "",
    type = "button",
    size = "md",
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
