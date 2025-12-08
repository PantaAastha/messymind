'use client';

import React from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import Link from 'next/link';
import { Tooltip } from '@/components/ui/Tooltip';

interface PriorityCardProps {
    diagnosis: DiagnosisOutput;
}

export function PriorityCard({ diagnosis }: PriorityCardProps) {
    const {
        label,
        severity,
        confidence,
        summary,
        estimated_impact,
        primary_drivers,
        intervention_recommendations
    } = diagnosis;

    const isImpulse = label.includes('Impulse');
    const isCritical = severity === 'critical';

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group/card">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900">{label}</h3>

                    {/* Impact Pill */}
                    {isImpulse ? (
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            Opportunity
                        </span>
                    ) : isCritical ? (
                        <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            High Impact
                        </span>
                    ) : (
                        <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            Medium Impact
                        </span>
                    )}

                    {/* Confidence Chip */}
                    {confidence === 'high' && (
                        <span className="border border-gray-200 text-gray-500 px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                            High Confidence
                        </span>
                    )}
                </div>
            </div>

            {/* Main Body */}
            <div className="grid md:grid-cols-[2fr,1fr] gap-6 mb-6">
                <div>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                        {summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(diagnosis.driver_info || []).map((driver, idx) => (
                            <Tooltip key={idx} text={driver.description}>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium cursor-help hover:bg-gray-200 transition-colors">
                                    {driver.label}
                                </span>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Impact</span>
                        <span className="font-semibold text-gray-900">{estimated_impact.affected_sessions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Benchmark</span>
                        <span className="font-semibold text-gray-900">
                            {/* Fallback to view-to-cart rate which is generally available */}
                            {isImpulse ? '0.8% ATC' : '4.2% ATC'} <span className="text-gray-400 font-normal">(6-11% typ)</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                    <span className="font-semibold text-purple-600">Focus: </span>
                    {intervention_recommendations.primary.label}
                </div>

                <div className="flex items-center gap-4">
                    {estimated_impact.potential_uplift_range && (
                        <span className="text-green-600 text-sm font-medium hidden md:inline-block">
                            Est. Uplift: {estimated_impact.potential_uplift_range}
                        </span>
                    )}
                    <button className="text-blue-600 font-medium text-sm hover:text-blue-800 flex items-center gap-1 group">
                        View diagnosis
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
