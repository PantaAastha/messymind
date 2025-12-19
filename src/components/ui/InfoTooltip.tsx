/**
 * Info Tooltip Component
 * 
 * Display an info icon that shows tooltip on hover
 */

'use client';

import React, { useState } from 'react';

interface InfoTooltipProps {
    content: React.ReactNode;
    className?: string;
}

export function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <button
                type="button"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                    </div>
                </div>
            )}
        </div>
    );
}
