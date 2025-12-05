/**
 * Home Page / Dashboard
 * 
 * Landing page with navigation to upload
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            MessyMind
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Messy Middle Diagnostic Tool
          </p>
          <p className="text-lg text-gray-500">
            Detect psychological friction patterns in your e-commerce customer journey
          </p>
        </div>

        {/* Main CTA */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Your Analysis
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload your GA4 event data to identify behavioral patterns like comparison paralysis
              and trust deficits that are preventing customers from completing purchases.
            </p>
          </div>

          <div className="flex justify-center">
            <Link
              href="/upload"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              New Diagnostic Analysis →
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Pattern Detection
            </h3>
            <p className="text-gray-600">
              Automatically identify comparison paralysis, trust deficits, and other behavioral friction patterns
              using advanced detection algorithms.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Actionable Insights
            </h3>
            <p className="text-gray-600">
              Get specific intervention recommendations backed by behavioral psychology to improve
              conversion rates and reduce cart abandonment.
            </p>
          </div>
        </div>

        {/* Patterns Supported */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Supported Behavioral Patterns
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Comparison Paralysis</h4>
              <p className="text-sm text-gray-600">
                Shoppers explore many products but fail to commit due to decision overload
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Trust & Risk Anxiety</h4>
              <p className="text-sm text-gray-600">
                Customers reach checkout but drop off due to trust, fit, or social proof concerns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
