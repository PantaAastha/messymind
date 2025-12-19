/**
 * Badge Component
 * 
 * Display status badges with different variants for warnings, info, success, and errors
 */

'use client';

import React from 'react';

interface BadgeProps {
    variant: 'warning' | 'info' | 'success' | 'error';
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
    const variants = {
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
