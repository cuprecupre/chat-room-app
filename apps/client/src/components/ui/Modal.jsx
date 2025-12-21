import React from "react";
import { createPortal } from "react-dom";

/**
 * Modal component with configurable size and variant
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Handler for closing modal
 * @param {string} title - Optional header title
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'lg')
 * @param {string} variant - 'card' | 'fullscreen' (default: 'card')
 * @param {ReactNode} children - Modal content
 */
export function Modal({ isOpen, onClose, children, title, size = "lg", variant = "card" }) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
    };

    // Fullscreen variant - takes entire screen
    if (variant === "fullscreen") {
        return createPortal(
            <div className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto animate-fadeIn">
                <div className="min-h-full flex flex-col p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        {title && (
                            <h2 className="text-2xl font-serif text-neutral-50">{title}</h2>
                        )}
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-white transition-colors p-2 ml-auto"
                            aria-label="Cerrar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // Card variant (default) - centered modal with backdrop
    return createPortal(
        <div className="fixed inset-0 z-50 animate-fadeIn">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Container - Scrollable, click outside to close */}
            <div
                className="relative h-full overflow-y-auto flex items-center justify-center p-4 sm:py-8"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                {/* Modal Content */}
                <div className={`relative w-full ${sizeClasses[size]} bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 animate-scaleIn`}>
                    {/* Header */}
                    {title && (
                        <div className="px-6 py-4 sm:px-8 sm:py-5 sticky top-0 bg-neutral-900 rounded-t-2xl z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-serif text-white">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                    aria-label="Cerrar"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Body - Scrollable */}
                    <div className="p-6 sm:px-8 sm:pb-8 max-h-[calc(90vh-80px)] overflow-y-auto">{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
}
