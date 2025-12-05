/**
 * Results Page (Placeholder)
 * 
 * Will show diagnostic results after analysis
 */

import Link from 'next/link';

export default function ResultsPage({ params }: { params: { sessionId: string } }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
                    <p className="text-gray-600 mt-2">Session ID: {params.sessionId}</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Data Uploaded Successfully!
                        </h2>

                        <p className="text-gray-600 mb-8">
                            Your data has been saved. The diagnostic analysis feature is coming in Phase 2.
                            For now, you can upload more data or return to the home page.
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/upload"
                                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Upload More Data
                            </Link>

                            <Link
                                href="/"
                                className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
