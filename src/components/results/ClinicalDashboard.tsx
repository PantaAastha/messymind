'use client';

import React, { useState } from 'react';
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
    sessionId: string; // NEW: Required for action item autosave
}

export function ClinicalDashboard({ diagnoses, aggregateMetrics, sessionCount, sessionId }: ClinicalDashboardProps) {
    const [selectedDiagnosis, setSelectedDiagnosis] = React.useState<DiagnosisOutput | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Helper to format date range from ISO dates
    const formatDateRange = (startDate: string, endDate: string): string => {
        try {
            const formatOptions: Intl.DateTimeFormatOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            };
            const start = new Date(startDate).toLocaleDateString('en-US', formatOptions);
            const end = new Date(endDate).toLocaleDateString('en-US', formatOptions);
            return `${start} – ${end}`;
        } catch {
            return 'Date range not available';
        }
    };

    // Get formatted date range from aggregateMetrics
    const dateRangeDisplay = aggregateMetrics.date_range_start && aggregateMetrics.date_range_end
        ? formatDateRange(aggregateMetrics.date_range_start, aggregateMetrics.date_range_end)
        : 'Date range not available';

    // 1. Prepare Stacked Bar Data
    // We want a single bar showing distribution of patterns + "Other" (Healthy/Unclassified)
    // Total sessions = sessionCount
    // Each diagnosis has 'estimated_impact.affected_session_count'
    // Note: Patterns can overlap, so this visualization is an approximation unless we strictly segment.
    // For MVP, we'll assume primary pattern assignment or just show relative prevalence.

    const patternData = diagnoses.map(d => {
        // Assign distinct colors based on pattern type
        let color = '#9CA3AF'; // default gray
        if (d.label.includes('Comparison') || d.label.includes('Paralysis')) {
            color = '#F59E0B'; // Amber/Orange for Comparison Paralysis
        } else if (d.label.includes('Trust') || d.label.includes('Risk') || d.label.includes('Social Proof')) {
            color = '#EF4444'; // Red for Trust/Risk
        } else if (d.label.includes('Impulse')) {
            color = '#60A5FA'; // Blue for Impulse
        } else if (d.severity === 'critical') {
            color = '#EF4444'; // Red for critical
        } else if (d.severity === 'warning') {
            color = '#F59E0B'; // Orange for warning
        }

        return {
            name: d.label,
            value: d.estimated_impact.affected_session_count || 0,
            color: color
        };
    }).sort((a, b) => b.value - a.value);

    const affectedTotal = patternData.reduce((sum, p) => sum + p.value, 0);
    const healthyOrOther = Math.max(0, sessionCount - affectedTotal);

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

    // Handle PDF download
    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);

        try {
            const pdfBase64 = await generateReportPDF(sessionId);

            // Convert base64 to blob and download
            const pdfBlob = base64ToBlob(pdfBase64, 'application/pdf');
            downloadBlob(pdfBlob, `messymind-report-${sessionId}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. Top Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-gray-500">{dateRangeDisplay}</div>
                        <h1 className="text-lg font-bold text-gray-900">Store-wide Analysis</h1>
                    </div>
                    <div>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating PDF...
                                </>
                            ) : (
                                'Download PDF'
                            )}
                        </button>
                    </div>
                </div>
            </div>

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

                {/* 3. Messy Middle Map */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Where sessions are getting stuck</h2>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="h-16 w-full rounded-lg overflow-hidden flex">
                            {patternData.map((p, idx) => (
                                <div
                                    key={idx}
                                    style={{ width: `${(p.value / sessionCount) * 100}%`, backgroundColor: p.color }}
                                    className="h-full border-r border-white/20 first:rounded-l-lg"
                                    title={`${p.name}: ${p.value} sessions`}
                                />
                            ))}
                            {/* Healthy/Other segment */}
                            <div
                                style={{ width: `${(healthyOrOther / sessionCount) * 100}%` }}
                                className="h-full bg-gray-200 last:rounded-r-lg"
                                title={`Other / Healthy: ${healthyOrOther} sessions`}
                            />
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-4 justify-center">
                            {patternData.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-2 cursor-pointer hover:opacity-75" onClick={() => {
                                    const d = diagnoses.find(diag => diag.label === p.name);
                                    if (d) setSelectedDiagnosis(d);
                                }}>
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                    <span className="text-sm text-gray-500">({Math.round((p.value / sessionCount) * 100)}%)</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                <span className="text-sm font-medium text-gray-700">Other / Unclassified</span>
                                <span className="text-sm text-gray-500">({Math.round((healthyOrOther / sessionCount) * 100)}%)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Priority List */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Prioritized Diagnosis</h2>
                    <div className="space-y-4">
                        {sortedDiagnoses.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patterns Detected</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    We analyzed your sessions and didn't find specific behavioral friction patterns like comparison paralysis. This suggests your "messy middle" is relatively clean!
                                </p>
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
