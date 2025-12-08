'use client';

import React from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import { EvidenceMetrics } from './EvidenceMetrics';
import { InterventionRecommendations } from './InterventionRecommendations';

interface DiagnosticSheetProps {
    diagnosis: DiagnosisOutput | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DiagnosticSheet({ diagnosis, isOpen, onClose }: DiagnosticSheetProps) {
    if (!diagnosis) return null;

    const {
        label,
        category,
        severity,
        summary,
        primary_drivers,
        evidence_metrics,
        intervention_recommendations,
    } = diagnosis;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div
                className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {severity === 'critical' ? (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Critical</span>
                                ) : (
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Warning</span>
                                )}
                                <span className="text-gray-500 text-sm font-medium">{category || 'Behavioral Pattern'}</span>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{label}</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">{summary}</p>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">

                        {/* 1. The Symptom */}
                        <section>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                                <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-600 text-xs">1</span>
                                The Symptom
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <EvidenceMetrics metrics={evidence_metrics} />
                            </div>
                        </section>

                        {/* 2. The Prescription */}
                        <section>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                                <span className="flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-600 text-xs">2</span>
                                The Prescription
                            </h3>

                            <InterventionRecommendations
                                recommendations={intervention_recommendations}
                            />
                        </section>

                    </div>
                </div>
            </div>
        </>
    );
}
