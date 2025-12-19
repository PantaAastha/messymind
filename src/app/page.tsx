/**
 * Home Page / Dashboard
 * 
 * Landing page with navigation to upload
 */

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative h-16 w-16">
                <Image
                  src="/MMlogo.png"
                  alt="MessyMind"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Messy Middle Diagnostic Tool
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Detect psychological friction patterns in your e-commerce customer journey
            </p>
          </div>

          {/* Main CTA */}
          <div className="card p-12 mb-12 hover:border-[#03AC13]/30 transition-all">
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
                className="inline-flex items-center px-8 py-4 bg-[#03AC13] text-white rounded-lg hover:bg-[#74B72E] transition-all text-lg font-semibold shadow-lg hover:shadow-xl cursor-pointer"
              >
                New Diagnostic Analysis
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-8 hover:border-[#03AC13]/30 transition-all group">
              <div className="w-12 h-12 bg-[#03AC13]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#74B72E]/20 transition-all">
                <svg className="w-6 h-6 text-[#03AC13] group-hover:text-[#74B72E] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Pattern Detection
              </h3>
              <p className="text-gray-500">
                Automatically identify comparison paralysis, trust deficits, and other behavioral friction patterns
                using advanced detection algorithms.
              </p>
            </div>

            <div className="card p-8 hover:border-[#AC039C]/30 transition-all group">
              <div className="w-12 h-12 bg-[#AC039C]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#AC039C]/20 transition-all">
                <svg className="w-6 h-6 text-[#AC039C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Actionable Insights
              </h3>
              <p className="text-gray-500">
                Get specific intervention recommendations backed by behavioral psychology to improve
                conversion rates and reduce cart abandonment.
              </p>
            </div>
          </div>

          {/* Patterns Supported */}
          <div className="mt-12 card p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Supported Behavioral Patterns
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-[#F59E0B] pl-4 py-2 hover:bg-[#F59E0B]/5 transition-all rounded-r">
                <h4 className="font-semibold text-foreground mb-2">Comparison Paralysis</h4>
                <p className="text-sm text-gray-500">
                  Shoppers explore many products but fail to commit due to decision overload
                </p>
              </div>
              <div className="border-l-4 border-[#DC2626] pl-4 py-2 hover:bg-[#DC2626]/5 transition-all rounded-r">
                <h4 className="font-semibold text-foreground mb-2">Trust & Risk Anxiety</h4>
                <p className="text-sm text-gray-500">
                  Customers reach checkout but drop off due to trust, fit, or social proof concerns
                </p>
              </div>
              <div className="border-l-4 border-[#3B82F6] pl-4 py-2 hover:bg-[#3B82F6]/5 transition-all rounded-r">
                <h4 className="font-semibold text-foreground mb-2">Impulse Browsing / Ambient Shopping</h4>
                <p className="text-sm text-gray-500">
                  Shoppers browse for inspiration or entertainment rather than immediate purchase
                </p>
              </div>
              <div className="border-l-4 border-[#A855F7] pl-4 py-2 hover:bg-[#A855F7]/5 transition-all rounded-r">
                <h4 className="font-semibold text-foreground mb-2">Value Uncertainty / Price Hesitation</h4>
                <p className="text-sm text-gray-500">
                  Customers stall at cart due to price concerns and hunt for deals or discounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
