'use client';

import React, { useState } from 'react';
import type { DiagnosisOutput } from '@/types/diagnostics';
import { EvidenceMetrics } from './EvidenceMetrics';
import { BehavioralFingerprint } from '../diagnosis/BehavioralFingerprint';
import { ActionChecklist } from '../diagnosis/ActionChecklist';

interface DiagnosticSheetProps {
    diagnosis: DiagnosisOutput | null;
    isOpen: boolean;
    onClose: () => void;
    sessionId: string; // NEW: Required for autosaving action items
}

export function DiagnosticSheet({ diagnosis, isOpen, onClose, sessionId }: DiagnosticSheetProps) {
    const [showExampleSessions, setShowExampleSessions] = useState(false);

    if (!diagnosis) return null;

    const {
        label,
        pattern_id,
        category,
        severity,
        summary,
        primary_drivers,
        driver_info,
        evidence_metrics,
        intervention_recommendations,
        estimated_impact,
        journey_timeline,
        revenue_at_risk,
        confidence,
        confidence_score,
        data_quality,
        example_sessions
    } = diagnosis;

    // Use top-level revenue_at_risk (already calculated and stored)
    const revenueAtRisk = revenue_at_risk || 0;
    const formattedRevenueMonthly = `$${Math.round(revenueAtRisk).toLocaleString()}`;
    const formattedRevenueAnnual = `$${Math.round(revenueAtRisk * 12).toLocaleString()}`;

    // Calculate comparison baseline
    const affectedPct = Math.round((evidence_metrics.pct_sessions_flagged || 0) * 100);
    const affectedCount = evidence_metrics.affected_session_count || 0;
    const totalSessions = evidence_metrics.total_sessions_analyzed || 0;

    // Format confidence label and sample size
    const confidenceLabel = confidence.charAt(0).toUpperCase() + confidence.slice(1);
    const sampleSize = data_quality?.sample_size || totalSessions || 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div
                className={`fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Enhanced Header */}
                    <div className="px-8 py-8 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                {/* Category + Severity */}
                                <div className="flex items-center gap-3 mb-3">
                                    {severity === 'critical' ? (
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Critical</span>
                                    ) : severity === 'warning' ? (
                                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Medium Priority</span>
                                    ) : (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Healthy</span>
                                    )}
                                    <span className="text-gray-500 text-sm font-medium">{category || 'Behavioral Pattern'}</span>
                                </div>

                                {/* Pattern Name - Large */}
                                <h2 className="text-4xl font-bold text-gray-900 mb-3">{label}</h2>

                                {/* Confidence & Sample Size Indicator */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {confidenceLabel} confidence ({confidence_score}%)
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">
                                        Based on {sampleSize} sessions
                                    </span>
                                </div>

                                {/* Summary */}
                                <p className="text-lg text-gray-600 leading-relaxed">{summary}</p>
                            </div>

                            {/* Close Button */}
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

                        {/* Combined Revenue at Risk + Key Evidence */}
                        <section>
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 shadow-sm">
                                {/* Revenue and Impact - Side by Side */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-red-200">
                                    {/* Revenue at Risk */}
                                    <div>
                                        <div className="text-sm font-medium text-red-700 uppercase tracking-wide mb-2">Revenue at Risk</div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-3xl font-bold text-red-600">{formattedRevenueMonthly}</div>
                                            <div className="text-xs text-red-600">/month</div>
                                        </div>
                                        <div className="text-base text-red-500 mt-1">
                                            {formattedRevenueAnnual}/year
                                        </div>
                                    </div>

                                    {/* Impact Scope */}
                                    <div>
                                        <div className="text-sm font-medium text-red-700 uppercase tracking-wide mb-2">Impact Scope</div>
                                        <div className="text-3xl font-bold text-red-600 mb-1">{affectedPct}%</div>
                                        <div className="text-sm text-red-600">
                                            {affectedCount} of {totalSessions} sessions affected
                                        </div>
                                    </div>
                                </div>

                                {/* Key Evidence */}
                                <EvidenceMetrics metrics={evidence_metrics} />
                            </div>
                        </section>

                        {/* Behavioral Fingerprint - Journey Timeline */}
                        {journey_timeline && journey_timeline.length > 0 && (
                            <section>
                                <BehavioralFingerprint
                                    journeyTimeline={journey_timeline}
                                    patternType={pattern_id}
                                />
                            </section>
                        )}

                        {/* Primary Drivers */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Primary Drivers
                            </h3>
                            <div className="space-y-3">
                                {driver_info?.map((driver, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2"></span>
                                            <div>
                                                <div className="font-semibold text-gray-900 mb-1">
                                                    {driver.label}
                                                </div>
                                                <div className="text-sm text-gray-600 leading-relaxed">
                                                    {driver.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Example Sessions - Expandable */}
                        {example_sessions && example_sessions.length > 0 && (
                            <section className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <button
                                    onClick={() => setShowExampleSessions(!showExampleSessions)}
                                    className="flex items-center justify-between w-full text-left group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            View Example Sessions ({example_sessions.length})
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-blue-600 font-medium">
                                            {showExampleSessions ? 'Hide' : 'Show'} Details
                                        </span>
                                        <svg
                                            className={`w-6 h-6 text-blue-600 transition-transform ${showExampleSessions ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {showExampleSessions && (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-4">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart Adds</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Behavior</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {example_sessions.map((session, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{session.session_id}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{session.products_viewed}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{session.session_minutes}m</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{session.cart_adds}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${session.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                                                session.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {session.confidence}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{session.key_behavior}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        <section>
                            <ActionChecklist
                                primary={intervention_recommendations.primary}
                                secondary={intervention_recommendations.secondary}
                                revenueAtRisk={revenueAtRisk}
                                sessionId={sessionId}
                                patternId={pattern_id}
                            />
                        </section>

                    </div>
                </div>
            </div>
        </>
    );
}
