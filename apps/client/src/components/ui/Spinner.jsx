import React from "react";

function classNames(list) {
    return list.filter(Boolean).join(" ");
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
};

export function Spinner({ size = "md", className = "", colorClass = "border-orange-400" }) {
    const styles = classNames([
        "inline-block rounded-full animate-spin border-2 border-t-transparent",
        sizeClasses[size],
        colorClass,
        className,
    ]);
    return <span aria-hidden="true" className={styles} />;
}

export default Spinner;
