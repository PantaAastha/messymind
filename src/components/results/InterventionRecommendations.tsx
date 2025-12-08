import React from 'react';
import type { InterventionRecommendation } from '@/types/diagnostics';

interface InterventionRecommendationsProps {
    recommendations: {
        primary: InterventionRecommendation;
        secondary: InterventionRecommendation;
        all_interventions: InterventionRecommendation[];
    };
}

export function InterventionRecommendations({ recommendations }: InterventionRecommendationsProps) {
    const { primary, secondary, all_interventions = [] } = recommendations;

    // Helper to check if an item is primary or secondary
    const isPrimary = (id: string) => id === primary.bucket;
    const isSecondary = (id: string) => id === secondary.bucket;

    // Sort: Primary first, then Secondary, then others
    const sortedInterventions = [...all_interventions].sort((a, b) => {
        if (isPrimary(a.bucket)) return -1;
        if (isPrimary(b.bucket)) return 1;
        if (isSecondary(a.bucket)) return -1;
        if (isSecondary(b.bucket)) return 1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Recommended Actions
            </h4>

            {sortedInterventions.map((item, idx) => {
                const primaryItem = isPrimary(item.bucket);
                const secondaryItem = isSecondary(item.bucket);
                const drivers = item.triggered_by || [];

                // Styling logic
                const containerClass = primaryItem
                    ? "bg-green-50 border border-green-200 shadow-sm"
                    : secondaryItem
                        ? "bg-blue-50 border border-blue-200 shadow-sm"
                        : "bg-white border border-gray-200 opacity-90 hover:opacity-100";

                const titleColor = primaryItem ? "text-green-900" : secondaryItem ? "text-gray-900" : "text-gray-700";
                const iconColor = primaryItem ? "text-green-700" : secondaryItem ? "text-blue-600" : "text-gray-400";
                const iconBg = primaryItem ? "bg-green-100" : secondaryItem ? "bg-blue-100" : "bg-gray-100";

                return (
                    <div key={idx} className={`${containerClass} rounded-lg p-5 transition-all`}>
                        <div className="flex items-start">
                            <div className={`${iconBg} rounded-full p-2 mr-3 mt-1 shrink-0`}>
                                <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {primaryItem ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    )}
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h5 className={`font-bold ${titleColor}`}>
                                        {primaryItem && "Top Priority: "}{secondaryItem && "Secondary: "}{item.label}
                                    </h5>

                                    {/* Trigger Drivers Tags */}
                                    {drivers.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {drivers.map((d, i) => (
                                                <span key={i} className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${primaryItem ? 'text-green-700 bg-white border-green-200' : 'text-blue-700 bg-white border-blue-200'}`}>
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <p className={`text-sm mb-3 ${primaryItem ? 'text-green-800' : 'text-gray-600'}`}>
                                    {item.description}
                                </p>

                                <div className={`rounded p-3 text-sm border ${primaryItem ? 'bg-white/60 border-green-100 text-green-900' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                                    <strong>Why it works:</strong> {item.why_it_works}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
