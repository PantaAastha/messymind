'use client';

import React from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import Link from 'next/link';
import { Tooltip } from '@/components/ui/Tooltip';

interface PriorityCardProps {
    diagnosis: DiagnosisOutput;
    isHighestRisk?: boolean; // Flag if this has the highest revenue at risk
}

export function PriorityCard({ diagnosis, isHighestRisk = false }: PriorityCardProps) {
    const {
        label,
        severity,
        confidence,
        summary,
        estimated_impact,
        primary_drivers,
        intervention_recommendations,
        revenue_at_risk,
        aov_is_placeholder
    } = diagnosis;

    const isImpulse = label.includes('Impulse');
    const isCritical = severity === 'critical' || isHighestRisk;

    // Format revenue with proper currency
    const formattedRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(revenue_at_risk);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group/card relative">
            {/* Priority Badge - Top Left */}
            <div className="absolute top-4 left-4 z-10">
                {isHighestRisk ? (
                    <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm border border-red-200">
                        🔴 CRITICAL | Fix First
                    </span>
                ) : (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm border border-yellow-200">
                        ⚠️ MEDIUM PRIORITY
                    </span>
                )}
            </div>

            <div className="p-6 pt-16">
                {/* Header Row */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-bold text-gray-900">{label}</h3>

                        {/* Confidence Chip */}
                        {confidence === 'high' && (
                            <span className="border border-gray-200 text-gray-500 px-2 py-0.5 rounded text-[10px] font-medium uppercase flex-shrink-0">
                                High Confidence
                            </span>
                        )}
                    </div>

                    {/* Revenue at Risk - PROMINENT DISPLAY */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-red-900 uppercase tracking-wide mb-1">
                                    💰 Revenue at Risk
                                </div>
                                <div className="text-3xl font-bold text-red-600">
                                    {formattedRevenue}
                                </div>
                                {aov_is_placeholder && (
                                    <div className="text-xs text-red-700 mt-1 italic">
                                        * Based on industry AOV (${estimated_impact.store_aov})
                                    </div>
                                )}
                            </div>
                            <div className="text-right text-sm text-gray-600">
                                <div className="font-medium text-gray-900">
                                    {estimated_impact.affected_session_count.toLocaleString()}
                                </div>
                                <div className="text-xs">sessions affected</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <p className="text-gray-700 mb-4 leading-relaxed">
                    {summary}
                </p>

                {/* Primary Drivers Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(diagnosis.driver_info || []).map((driver, idx) => (
                        <Tooltip key={idx} text={driver.description}>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium cursor-help hover:bg-gray-200 transition-colors">
                                {driver.label}
                            </span>
                        </Tooltip>
                    ))}
                </div>

                {/* Footer  with CTA */}
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
                        <button className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 group">
                            See Action Plan
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
