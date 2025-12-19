'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DiagnosisOutput, AggregateMetrics } from '@/types/diagnostics';
import { PriorityCard } from './PriorityCard';
import { DiagnosticSheet } from './DiagnosticSheet';
import { generateReportPDF } from '@/app/actions/generatePDF';
import { base64ToBlob, downloadBlob } from '@/lib/pdf/utils';

interface ClinicalDashboardProps {
    diagnoses: DiagnosisOutput[];
    aggregateMetrics: AggregateMetrics; // We need store-level metrics for Hero
    sessionCount: number;
    sessionId: string; // Required for DiagnosticSheet action item autosave
}

export function ClinicalDashboard({ diagnoses, aggregateMetrics, sessionCount, sessionId }: ClinicalDashboardProps) {
    const [selectedDiagnosis, setSelectedDiagnosis] = React.useState<DiagnosisOutput | null>(null);

    // ============================================================================
    // SEVERITY WATERFALL: Winner-Takes-All Pattern Assignment
    // ============================================================================
    // Problem: Sessions can match multiple patterns (e.g., both Trust AND Paralysis)
    // Solution: Assign each session to EXACTLY ONE dominant pattern based on business priority
    // 
    // Hierarchy (Bottom of Funnel → Top of Funnel):
    //   1. Trust & Risk (Critical) - At checkout, highest intent
    //   2. Comparison Paralysis (Friction) - Active interest, stuck
    //   3. Ambient Shopping (Opportunity) - Browsing, low intent
    //
    // This ensures the bar chart totals exactly 100% and shows true distribution

    // Define pattern priority with explicit mapping (lower number = higher priority)
    const PATTERN_PRIORITY: Record<string, number> = {
        'trust_risk_social_proof': 1,  // Highest - checkout abandonment
        'value_uncertainty': 2,         // High - cart hesitation / price concerns
        'comparison_paralysis': 3,      // Medium - decision friction
        'ambient_shopping': 4,          // Low - browsing behavior
    };

    const getPatternPriority = (patternId: string): number => {
        return PATTERN_PRIORITY[patternId] || 99; // Unknown patterns get lowest priority
    };

    // Sort diagnoses by priority (and by affected count as tiebreaker) to apply waterfall
    const sortedByPriority = [...diagnoses].sort((a, b) => {
        const priorityDiff = getPatternPriority(a.pattern_id) - getPatternPriority(b.pattern_id);
        if (priorityDiff !== 0) return priorityDiff;
        // If same priority, higher affected count wins
        return (b.estimated_impact.affected_session_count || 0) - (a.estimated_impact.affected_session_count || 0);
    });

    // Apply waterfall logic: 
    // Start with all sessions, assign to highest priority pattern first, then remove those sessions
    let remainingSessions = sessionCount;
    const dominantPatternCounts: Array<{
        patternId: string;
        pattern: DiagnosisOutput;
        dominantCount: number;
        totalAffected: number; // Original affected count (for hover tooltip)
        overlaps: Array<{ patternId: string; label: string }>;
    }> = [];

    sortedByPriority.forEach((diagnosis) => {
        const originalAffected = diagnosis.estimated_impact.affected_session_count || 0;

        // This pattern gets assigned all its sessions that haven't been claimed yet
        // In reality, some of these sessions also match lower-priority patterns (that's the overlap)
        const assignedCount = Math.min(originalAffected, remainingSessions);

        if (assignedCount > 0) {
            // Find which other patterns this overlaps with (lower priority patterns that also detected these sessions)
            const overlappingPatterns = diagnoses
                .filter(d => getPatternPriority(d.pattern_id) > getPatternPriority(diagnosis.pattern_id))
                .filter(d => (d.estimated_impact.affected_session_count || 0) > 0)
                .map(d => ({ patternId: d.pattern_id, label: d.label }));

            dominantPatternCounts.push({
                patternId: diagnosis.pattern_id,
                pattern: diagnosis,
                dominantCount: assignedCount,
                totalAffected: originalAffected,
                overlaps: overlappingPatterns
            });

            remainingSessions -= assignedCount;
        }
    });

    // Color mapping for patterns
    const getPatternColor = (label: string): string => {
        if (label.includes('Trust') || label.includes('Risk') || label.includes('Social Proof')) {
            return '#DC2626'; // Red-600 for Trust/Risk (Critical)
        } else if (label.includes('Value') || label.includes('Uncertainty') || label.includes('Price')) {
            return '#A855F7'; // Purple-500 for Value Uncertainty (High Priority)
        } else if (label.includes('Comparison') || label.includes('Paralysis')) {
            return '#F59E0B'; // Amber-500 for Comparison Paralysis
        } else if (label.includes('Impulse') || label.includes('Ambient') || label.includes('Shopping')) {
            return '#3B82F6'; // Blue-500 for Ambient Shopping
        }
        return '#9CA3AF'; // Gray-400 default
    };

    // Prepare data for the single stacked bar
    const stackedBarData = dominantPatternCounts.map(item => ({
        name: item.pattern.label,
        patternId: item.patternId,
        value: item.dominantCount,
        totalAffected: item.totalAffected,
        percentage: ((item.dominantCount / sessionCount) * 100).toFixed(1),
        color: getPatternColor(item.pattern.label),
        overlaps: item.overlaps,
        diagnosis: item.pattern
    }));

    const totalAffected = dominantPatternCounts.reduce((sum, item) => sum + item.dominantCount, 0);
    const healthyCount = sessionCount - totalAffected;

    // Sort diagnoses by Priority Score (already sorted by revenue_at_risk in backend)
    const sortedDiagnoses = [...diagnoses].sort((a, b) => (b.revenue_at_risk || 0) - (a.revenue_at_risk || 0));

    // Calculate total revenue at risk
    const totalRevenueAtRisk = diagnoses.reduce((sum, d) => sum + (d.revenue_at_risk || 0), 0);
    const formattedTotalRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalRevenueAtRisk);

    // Identify highest risk pattern
    const highestRiskAmount = sortedDiagnoses[0]?.revenue_at_risk || 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">

                {/* 2. Health Snapshot (Hero) */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatTile
                            label="Store Conversion"
                            value={aggregateMetrics ? `${(aggregateMetrics.store_conversion_rate * 100).toFixed(1)}%` : 'N/A'}
                            benchmark="2-3%"
                        />
                        <StatTile
                            label="Total Revenue at Risk"
                            value={formattedTotalRevenue}
                            highlight={true}
                        />
                        <StatTile
                            label="Add-to-Cart Rate"
                            value={`${(aggregateMetrics?.avg_view_to_cart_rate * 100).toFixed(1)}%`}
                            benchmark="6-11%"
                            highlight={aggregateMetrics?.avg_view_to_cart_rate < 0.05}
                        />
                        <StatTile
                            label="Checkout Completion"
                            value={aggregateMetrics ? `${(aggregateMetrics.checkout_completion_rate * 100).toFixed(1)}%` : 'N/A'}
                            benchmark="70-75%"
                        />
                        <StatTile
                            label="Sessions Analyzed"
                            value={sessionCount.toLocaleString()}
                        />
                    </div>
                    <p className="text-gray-600 text-center max-w-2xl mx-auto">
                        We’ve analyzed <strong>{sessionCount.toLocaleString()} sessions</strong> from your data to identify where shoppers get stuck in the messy middle.
                    </p>
                </section>

                {/* 3. Triage Stack - Single Stacked Bar */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Where sessions are getting stuck</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Each session is categorized by its most critical issue{' '}
                        <span className="font-medium text-gray-700">(checkout issues take priority over browsing friction)</span>
                    </p>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        {/* Single Stacked Bar */}
                        <div className="relative">
                            <div className="h-20 w-full rounded-lg overflow-hidden flex shadow-inner border border-gray-200">
                                {stackedBarData.map((segment, idx) => (
                                    <div
                                        key={segment.patternId}
                                        style={{
                                            width: `${segment.percentage}%`,
                                            backgroundColor: segment.color
                                        }}
                                        className="h-full relative group cursor-pointer transition-all hover:brightness-110"
                                        onClick={() => setSelectedDiagnosis(segment.diagnosis)}
                                    >
                                        {/* Hover Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2.5 px-3.5 shadow-xl whitespace-nowrap">
                                                <div className="font-bold mb-1.5">{segment.name}</div>
                                                <div className="text-gray-200">
                                                    <strong>Primary:</strong> {segment.value} sessions ({segment.percentage}%)
                                                </div>
                                                {segment.totalAffected > segment.value && (
                                                    <div className="text-gray-400 text-[10px] mt-1.5 pt-1.5 border-t border-gray-700">
                                                        Also detected: {segment.totalAffected - segment.value} more sessions
                                                        <br />(assigned to higher priority patterns)
                                                    </div>
                                                )}
                                                {segment.overlaps.length > 0 && (
                                                    <div className="text-gray-400 text-[10px] mt-1.5 pt-1.5 border-t border-gray-700">
                                                        May overlap with: {segment.overlaps.map(o => o.label.split(/[(&]/)[0].trim()).join(', ')}
                                                    </div>
                                                )}
                                                <div className="text-gray-500 text-[10px] mt-1.5 pt-1.5 border-t border-gray-700">
                                                    💡 Click to view full details
                                                </div>
                                                {/* Tooltip arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                                    <div className="border-8 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Percentage label inside bar (only if wide enough) */}
                                        {parseFloat(segment.percentage) > 8 && (
                                            <div className="h-full flex items-center justify-center">
                                                <span className="text-white font-bold text-sm px-2 drop-shadow-sm">
                                                    {segment.percentage}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Healthy/Other segment */}
                                {healthyCount > 0 && (
                                    <div
                                        style={{ width: `${((healthyCount / sessionCount) * 100).toFixed(1)}%` }}
                                        className="h-full bg-emerald-50 border-l border-emerald-200 flex items-center justify-center relative group cursor-default"
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2.5 px-3.5 shadow-xl whitespace-nowrap">
                                                <div className="font-bold mb-1.5">✅ Healthy Sessions</div>
                                                <div className="text-gray-200">
                                                    {healthyCount} sessions ({((healthyCount / sessionCount) * 100).toFixed(1)}%)
                                                </div>
                                                <div className="text-gray-400 text-[10px] mt-1.5 pt-1.5 border-t border-gray-700">
                                                    No major friction patterns detected
                                                </div>
                                                {/* Tooltip arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                                    <div className="border-8 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </div>
                                        {((healthyCount / sessionCount) * 100) > 8 && (
                                            <span className="text-emerald-700 font-bold text-sm">
                                                {((healthyCount / sessionCount) * 100).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            {stackedBarData.map((segment) => (
                                <button
                                    key={segment.patternId}
                                    onClick={() => setSelectedDiagnosis(segment.diagnosis)}
                                    className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity group"
                                >
                                    <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: segment.color }}></div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        {segment.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({segment.value} · {segment.percentage}%)
                                    </span>
                                </button>
                            ))}
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm bg-emerald-50 border border-emerald-200"></div>
                                <span className="text-sm font-medium text-gray-700">Healthy Sessions</span>
                                <span className="text-sm text-gray-500">
                                    ({healthyCount} · {((healthyCount / sessionCount) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Priority List */}
                <section>
                    {sortedDiagnoses.length > 0 && (
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Prioritized Diagnosis</h2>
                    )}
                    <div className="space-y-4">
                        {sortedDiagnoses.length === 0 ? (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-12 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    🎉 Clean Bill of Health!
                                </h3>

                                <p className="text-gray-600 mb-6 max-w-xl mx-auto leading-relaxed">
                                    Great news! We analyzed <strong>{sessionCount.toLocaleString()} sessions</strong> and didn&apos;t detect
                                    major behavioral friction patterns like comparison paralysis or trust hesitation.
                                    Your customer journey appears to be working smoothly.
                                </p>

                                {/* What This Means */}
                                <div className="bg-white rounded-lg p-6 mb-6 max-w-2xl mx-auto shadow-sm">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                                        <span className="text-green-600">💡</span>
                                        What This Means
                                    </h4>
                                    <ul className="text-sm text-gray-700 space-y-2 text-left">
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 font-bold mt-0.5">•</span>
                                            <span>Your conversion rate ({(aggregateMetrics.store_conversion_rate * 100).toFixed(1)}%) is within healthy range</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 font-bold mt-0.5">•</span>
                                            <span>Shoppers are moving through your funnel without major friction</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-600 font-bold mt-0.5">•</span>
                                            <span>No significant trust or decision-making barriers detected</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Next Steps */}
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Want to optimize further?</p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link href="/dashboard" className="btn-secondary inline-flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            View All Analyses
                                        </Link>
                                        <Link href="/upload" className="btn-primary inline-flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Analyze Another Period
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            sortedDiagnoses.map((d) => (
                                <div key={d.pattern_id} onClick={() => setSelectedDiagnosis(d)} className="cursor-pointer transition-transform active:scale-[0.99]">
                                    <PriorityCard
                                        diagnosis={d}
                                        isHighestRisk={d.revenue_at_risk === highestRiskAmount && highestRiskAmount > 0}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </main>

            <DiagnosticSheet
                diagnosis={selectedDiagnosis}
                isOpen={!!selectedDiagnosis}
                onClose={() => setSelectedDiagnosis(null)}
                sessionId={sessionId}
            />
        </div>
    );
}

function StatTile({ label, value, benchmark, highlight }: { label: string, value: string, benchmark?: string, highlight?: boolean }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-2xl font-bold mb-1 ${highlight ? 'text-red-500' : 'text-gray-900'}`}>{value}</div>
            {benchmark && (
                <div className="text-xs text-gray-400">Bench: {benchmark}</div>
            )}
        </div>
    );
}
