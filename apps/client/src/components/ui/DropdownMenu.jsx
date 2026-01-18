import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function DropdownMenu({ trigger, children, align = 'right' }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-50 mt-2 w-48 origin-top-right rounded-md bg-neutral-900 border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                    >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            {React.Children.map(children, (child) => {
                                // Inject onClick to close menu
                                if (React.isValidElement(child)) {
                                    return React.cloneElement(child, {
                                        onClick: (e) => {
                                            child.props.onClick?.(e);
                                            setIsOpen(false);
                                        }
                                    });
                                }
                                return child;
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function DropdownItem({ children, onClick, className = "", danger = false }) {
    return (
        <button
            className={`w-full text-left block px-4 py-2 text-sm transition-colors ${danger
                    ? 'text-red-400 hover:bg-white/5'
                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                } ${className}`}
            role="menuitem"
            onClick={onClick}
        >
            {children}
        </button>
    );
}
