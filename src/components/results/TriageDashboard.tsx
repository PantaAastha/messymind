'use client';

import React, { useState } from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import type { HealthStatus } from '@/lib/metrics/healthScore';
import { TriageBoard } from './TriageBoard';
import { DiagnosticSheet } from './DiagnosticSheet';
import Link from 'next/link';

interface TriageDashboardProps {
    diagnoses: DiagnosisOutput[];
    health: HealthStatus;
    sessionName: string;
    sessionDate: string;
    sessionCount: number;
}

export function TriageDashboard({
    diagnoses,
    health,
    sessionName,
    sessionDate,
    sessionCount
}: TriageDashboardProps) {
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisOutput | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar / Health Pulse */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Session Info */}
                        <div>
                            <div className="flex items-baseline gap-3">
                                <h1 className="text-xl font-bold text-gray-900">{sessionName}</h1>
                                <span className="text-sm text-gray-500">{sessionDate}</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                {sessionCount} sessions analyzed
                            </div>
                        </div>

                        {/* Health Stats */}
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Health Score</div>
                                    <div className={`text-2xl font-bold ${getHealthColor(health.score)}`}>
                                        {health.score}/100
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-gray-200"></div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue Risk</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        ${health.revenueAtRisk.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <Link
                                href="/upload"
                                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                New Analysis
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verdict Banner */}
            <div className={`${getVerdictBg(health.status)} border-b border-gray-200/50 px-6 py-3 text-center`}>
                <p className={`text-sm font-medium ${getVerdictText(health.status)}`}>
                    {health.verdict}
                </p>
            </div>

            {/* Main Board */}
            <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
                <TriageBoard
                    diagnoses={diagnoses}
                    onSelectDiagnosis={setSelectedDiagnosis}
                />
            </main>

            {/* Slide-out Sheet */}
            <DiagnosticSheet
                diagnosis={selectedDiagnosis}
                isOpen={!!selectedDiagnosis}
                onClose={() => setSelectedDiagnosis(null)}
                sessionId="current"
            />
        </div>
    );
}

// Helpers
function getHealthColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
}

function getVerdictBg(status: string): string {
    switch (status) {
        case 'Ecstatic': return 'bg-green-50';
        case 'Healthy': return 'bg-blue-50';
        case 'Strained': return 'bg-yellow-50';
        case 'Critical': return 'bg-red-50';
        default: return 'bg-gray-50';
    }
}

function getVerdictText(status: string): string {
    switch (status) {
        case 'Ecstatic': return 'text-green-800';
        case 'Healthy': return 'text-blue-800';
        case 'Strained': return 'text-yellow-800';
        case 'Critical': return 'text-red-800';
        default: return 'text-gray-800';
    }
}
