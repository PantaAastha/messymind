/**
 * Processing Overlay Component
 * 
 * Shows a full-screen modal with animated progress during data processing
 */

'use client';

import React from 'react';

type ProcessingStage = 'uploading' | 'parsing' | 'analyzing' | 'complete';

interface ProcessingOverlayProps {
    stage: ProcessingStage;
}

const stages = [
    { id: 'uploading', label: 'Uploading data', icon: '☁️', description: 'Sending your data securely...' },
    { id: 'parsing', label: 'Parsing sessions', icon: '📊', description: 'Extracting behavioral metrics...' },
    { id: 'analyzing', label: 'Detecting patterns', icon: '🔍', description: 'Running diagnostic engine...' },
    { id: 'complete', label: 'Analysis complete', icon: '✅', description: 'Preparing your results...' },
] as const;

export function ProcessingOverlay({ stage }: ProcessingOverlayProps) {
    const currentIndex = stages.findIndex(s => s.id === stage);
    const currentStage = stages[currentIndex];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">

                {/* Icon & Title */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                        <span className="text-4xl">{currentStage.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {currentStage.label}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {currentStage.description}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3 mb-6">
                    {stages.map((s, idx) => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-3 transition-all duration-300 ${idx <= currentIndex ? 'opacity-100' : 'opacity-30'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${idx < currentIndex
                                ? 'bg-green-500 text-white scale-100'
                                : idx === currentIndex
                                    ? 'bg-blue-500 text-white scale-110 animate-pulse'
                                    : 'bg-gray-200 text-gray-400'
                                }`}>
                                {idx < currentIndex ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    idx + 1
                                )}
                            </div>
                            <span className={`text-sm transition-all duration-300 ${idx <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
                                }`}>
                                {s.label}
                            </span>
                            {idx === currentIndex && (
                                <div className="ml-auto">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-500 ease-out shadow-lg"
                        style={{ width: `${((currentIndex + 1) / stages.length) * 100}%` }}
                    />
                </div>

                {/* Time estimate */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    This usually takes less than 30 seconds
                </p>
            </div>
        </div>
    );
}
