import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function Accordion({ title, children, defaultOpen = false, className = "" }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div
            className={`border border-white/10 rounded-lg bg-neutral-900/50 overflow-hidden ${className}`}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
                <h3 className="text-lg font-serif text-orange-400">{title}</h3>
                {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                )}
            </button>

            {isOpen && (
                <div className="p-4 pt-0 border-t border-white/5 text-neutral-300">{children}</div>
            )}
        </div>
    );
}
