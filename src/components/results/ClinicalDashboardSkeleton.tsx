/**
 * Clinical Dashboard Skeleton
 * 
 * Loading placeholder that matches the final dashboard layout
 */

'use client';

import { Shimmer } from '../ui/Shimmer';

export function ClinicalDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">

                {/* Health Snapshot Skeleton */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                                <Shimmer className="h-3 rounded w-20" />
                                <Shimmer className="h-8 rounded w-16" />
                                <Shimmer className="h-2 rounded w-14" />
                            </div>
                        ))}
                    </div>
                    <Shimmer className="h-4 rounded w-96 mx-auto" />
                </section>

                {/* Triage Stack Skeleton */}
                <section>
                    <Shimmer className="h-6 rounded w-48 mb-2" />
                    <Shimmer className="h-4 rounded w-64 mb-4" />

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <Shimmer className="h-20 rounded-lg mb-6" />
                        <div className="flex flex-wrap gap-4 justify-center">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-2">
                                    <Shimmer className="w-4 h-4 rounded-sm" />
                                    <Shimmer className="h-4 rounded w-32" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pattern Cards Skeleton */}
                <section>
                    <Shimmer className="h-6 rounded w-40 mb-6" />
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 space-y-2">
                                        <Shimmer className="h-6 rounded w-48" />
                                        <Shimmer className="h-4 rounded w-32" />
                                    </div>
                                    <Shimmer className="h-10 rounded w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Shimmer className="h-4 rounded w-full" />
                                    <Shimmer className="h-4 rounded w-5/6" />
                                    <Shimmer className="h-4 rounded w-4/6" />
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Shimmer className="h-6 rounded-full w-24" />
                                    <Shimmer className="h-6 rounded-full w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
