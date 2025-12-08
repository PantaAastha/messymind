'use client';

import React, { useState } from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import { getSeverityColor } from '@/lib/detection/triageRules';

interface TriageBoardProps {
    diagnoses: DiagnosisOutput[];
    onSelectDiagnosis: (d: DiagnosisOutput) => void;
}

export function TriageBoard({ diagnoses, onSelectDiagnosis }: TriageBoardProps) {
    const critical = diagnoses.filter(d => d.severity === 'critical');
    const warning = diagnoses.filter(d => d.severity === 'warning');

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Critical Column */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <h3 className="text-lg font-bold text-gray-900">Critical Attention Needed</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {critical.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {critical.length === 0 && (
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
                            <p className="text-gray-400 text-sm">No critical issues detected 🎉</p>
                        </div>
                    )}
                    {critical.map(d => (
                        <TriageCard key={d.pattern_id} diagnosis={d} onClick={() => onSelectDiagnosis(d)} />
                    ))}
                </div>
            </div>

            {/* Warning Column */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <h3 className="text-lg font-bold text-gray-900">monitor & Analyze</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {warning.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {warning.length === 0 && (
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
                            <p className="text-gray-400 text-sm">No warnings pending</p>
                        </div>
                    )}
                    {warning.map(d => (
                        <TriageCard key={d.pattern_id} diagnosis={d} onClick={() => onSelectDiagnosis(d)} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TriageCard({ diagnosis, onClick }: { diagnosis: DiagnosisOutput; onClick: () => void }) {
    const { label, category, estimated_impact, primary_drivers } = diagnosis;

    // Fallback/Default values if types not fully populated yet
    const displayCategory = category || 'Uncategorized';

    return (
        <div
            onClick={onClick}
            className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${diagnosis.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>

            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                        {displayCategory}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {label}
                    </h4>
                </div>
                <div className="flex -space-x-2">
                    {/* Placeholder avatars for 'affected users' visualization */}
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-500">?</div>
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {primary_drivers[0] ? `Driven by ${primary_drivers[0].toLowerCase()}...` : diagnosis.summary}
            </p>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {estimated_impact.affected_sessions}
                </div>
                <div className="flex items-center gap-1 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {estimated_impact.potential_uplift_range}
                </div>
            </div>
        </div>
    );
}
