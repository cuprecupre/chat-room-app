import React from 'react';

export function ClueRoundTimer({ timeLeft }) {
    return (
        <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-bold tabular-nums">
                {timeLeft}s
            </span>
        </div>
    );
}
