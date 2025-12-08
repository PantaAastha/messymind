'use client';

import React, { useState } from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import { EvidenceMetrics } from './EvidenceMetrics';
import { InterventionRecommendations } from './InterventionRecommendations';

interface PatternCardProps {
    diagnosis: DiagnosisOutput;
}

export function PatternCard({ diagnosis }: PatternCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        label,
        confidence,
        confidence_score,
        summary,
        primary_drivers,
        estimated_impact,
        evidence_metrics,
        intervention_recommendations,
    } = diagnosis;

    const confidenceColor = {
        high: 'bg-red-100 text-red-800 border-red-200',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        low: 'bg-blue-100 text-blue-800 border-blue-200',
    }[confidence];

    const borderColor = {
        high: 'border-red-200',
        medium: 'border-yellow-200',
        low: 'border-blue-200',
    }[confidence];

    return (
        <div className={`bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden mb-6 transition-all duration-200`}>
            {/* Header - Always visible */}
            <div className="p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{label}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${confidenceColor}`}>
                                {confidence.toUpperCase()} ({confidence_score}%)
                            </span>
                        </div>
                        <p className="text-gray-600">{summary}</p>
                    </div>
                    <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                        <svg
                            className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Preview of impact when collapsed */}
                {!isExpanded && (
                    <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{estimated_impact.affected_sessions}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{estimated_impact.potential_uplift_range}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-gray-100 bg-white">
                    <div className="p-6 space-y-8">

                        {/* Primary Drivers */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Primary Drivers (Why this is happening)
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                                {primary_drivers.map((driver, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                        {driver}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Two Column Layout for Metrics and Recommendations */}
                        <div className="grid lg:grid-cols-2 gap-8">
                            <EvidenceMetrics metrics={evidence_metrics} />

                            <InterventionRecommendations
                                recommendations={intervention_recommendations}
                            />
                        </div>

                        {/* Estimated Impact Footer */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-blue-800 font-medium">Estimated Impact</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {estimated_impact.potential_uplift_range}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-blue-800 font-medium">Affected Sessions</p>
                                <p className="text-xl font-bold text-blue-900">
                                    {estimated_impact.affected_session_count}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
