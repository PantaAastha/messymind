import React from 'react';
import type { EvidenceMetrics as EvidenceMetricsType } from '@/types/diagnostics';

interface EvidenceMetricsProps {
    metrics: EvidenceMetricsType;
}

export function EvidenceMetrics({ metrics }: EvidenceMetricsProps) {
    const {
        avg_view_to_cart_rate,
        avg_products_viewed_per_session,
        avg_session_duration_minutes,
        avg_same_category_ratio,
        pct_sessions_flagged,
    } = metrics;

    const percentage = Math.round(pct_sessions_flagged * 100);

    return (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Key Evidence
            </h4>

            <div className="space-y-4">
                {/* Affected Sessions */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">Affected Traffic</span>
                        <span className="text-gray-900 font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {metrics.affected_session_count} out of {metrics.total_sessions_analyzed} sessions matched this pattern
                    </p>
                </div>

                {/* View to Cart Rate */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                        <p className="text-xs text-gray-500">View-to-Cart Rate</p>
                        <p className="text-lg font-bold text-gray-900">
                            {(avg_view_to_cart_rate * 100).toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Avg Products Viewed</p>
                        <p className="text-lg font-bold text-gray-900">
                            {avg_products_viewed_per_session.toFixed(1)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Avg Duration</p>
                        <p className="text-lg font-bold text-gray-900">
                            {avg_session_duration_minutes.toFixed(1)}m
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Same Category Focus</p>
                        <p className="text-lg font-bold text-gray-900">
                            {(avg_same_category_ratio * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
