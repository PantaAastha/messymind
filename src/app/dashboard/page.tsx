import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's diagnostic sessions with result counts
    const { data: sessions, error } = await supabase
        .from('diagnostic_sessions')
        .select(`
            id,
            name,
            created_at,
            date_range_start,
            date_range_end,
            diagnostic_results (
                id,
                detected,
                pattern_id
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sessions:', error)
    }

    const sessionsWithCounts = sessions?.map(session => ({
        ...session,
        patternCount: session.diagnostic_results?.filter((r: any) => r.detected).length || 0,
        totalResults: session.diagnostic_results?.length || 0
    })) || []

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Diagnostic Sessions</h1>
                    <p className="text-gray-600">View and manage your behavioral pattern analyses</p>
                </div>

                {/* CTA to create new */}
                <div className="mb-8">
                    <Link
                        href="/upload"
                        className="inline-flex items-center px-6 py-3 bg-[#03AC13] text-white rounded-lg hover:bg-[#74B72E] transition-all font-semibold shadow-sm cursor-pointer"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Analysis
                    </Link>
                </div>

                {/* Sessions Grid */}
                {sessionsWithCounts.length === 0 ? (
                    // Empty State
                    <div className="card p-12 text-center">
                        <div className="mx-auto h-32 w-32 mb-6 relative">
                            <Image
                                src="/MMlogo.png"
                                alt="MessyMind"
                                width={128}
                                height={128}
                                className="object-contain"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No analyses yet</h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Start your first diagnostic analysis to identify behavioral friction patterns in your customer journey
                        </p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center px-6 py-3 bg-[#03AC13] text-white rounded-lg hover:bg-[#74B72E] transition-all font-semibold shadow-sm cursor-pointer"
                        >
                            Create Your First Analysis
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                ) : (
                    // Sessions Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessionsWithCounts.map((session) => (
                            <Link
                                key={session.id}
                                href={`/results/${session.id}`}
                                className="card p-6 hover:shadow-lg transition-all hover:border-[#AC039C]/30 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-[#03AC13] transition-colors">
                                            {session.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(session.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#AC039C] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>

                                {session.date_range_start && session.date_range_end && (
                                    <div className="text-sm text-gray-600 mb-4">
                                        <span className="font-medium">Data Period:</span> {session.date_range_start} to {session.date_range_end}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#AC039C]"></div>
                                        <span className="text-sm text-gray-700">
                                            <span className="font-semibold text-gray-900">{session.patternCount}</span> pattern{session.patternCount !== 1 ? 's' : ''} detected
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
