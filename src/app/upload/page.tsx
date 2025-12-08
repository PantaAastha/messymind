'use client';

/**
 * Upload Page
 * 
 * CSV upload interface for diagnostic analysis
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/upload/FileUploader';
import { generateSampleGA4Data, eventsToCSV, downloadCSV } from '@/lib/csv/sampleDataGenerator';
import { validateGA4Events } from '@/lib/csv/parser';
import type { GA4Event, CSVValidationResult } from '@/types/csv';

export default function UploadPage() {
    const router = useRouter();
    const [events, setEvents] = useState<GA4Event[] | null>(null);
    const [validation, setValidation] = useState<CSVValidationResult | null>(null);
    const [sessionName, setSessionName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUploadComplete = (uploadedEvents: GA4Event[], uploadedValidation: CSVValidationResult) => {
        setEvents(uploadedEvents);
        setValidation(uploadedValidation);

        // Auto-generate session name from date range
        if (uploadedValidation.date_range) {
            const { start, end } = uploadedValidation.date_range;
            setSessionName(`Analysis ${start} to ${end}`);
        }
    };

    const handleGenerateSample = () => {
        const sampleEvents = generateSampleGA4Data({
            sessionCount: 30,
            comparisonParalysisRate: 0.3,
            trustRiskRate: 0.25,
        });

        const csv = eventsToCSV(sampleEvents);
        downloadCSV(csv, 'sample_ga4_data.csv');
    };

    const handleUseDemoData = () => {
        // Generate sample data directly
        const sampleEvents = generateSampleGA4Data({
            sessionCount: 30,
            comparisonParalysisRate: 0.4,
            trustRiskRate: 0.4,
        });

        // Validate it
        const sampleValidation = validateGA4Events(sampleEvents);

        // Set it as if uploaded
        handleUploadComplete(sampleEvents, sampleValidation);
    };

    const handleSubmit = async () => {
        if (!events || !sessionName.trim()) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sessionName,
                    events,
                    validation,
                }),
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { sessionId } = await response.json();

            // Redirect to processing/results page
            router.push(`/results/${sessionId}`);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">New Diagnostic Analysis</h1>
                    <p className="text-gray-600 mt-2">
                        Upload your GA4 event data to detect behavioral friction patterns
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="space-y-8">
                    {/* Demo Data Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                Try it with Demo Data
                            </h3>
                            <p className="text-sm text-blue-700 mb-4">
                                Use synthetic GA4 data with realistic behavioral patterns to test the diagnostic tool
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={handleUseDemoData}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Use Demo Data
                                </button>
                                <button
                                    onClick={handleGenerateSample}
                                    className="px-6 py-2.5 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-gray-50 text-gray-500">or upload your own data</span>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Upload GA4 Event Data
                        </h2>

                        <FileUploader onUploadComplete={handleUploadComplete} />

                        {/* Validation Results */}
                        {validation && (
                            <div className="mt-6 space-y-4">
                                {/* Success Info */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <svg
                                            className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-green-800">File validated successfully</h3>
                                            <div className="text-sm text-green-700 mt-2 space-y-1">
                                                <p>• {validation.row_count.toLocaleString()} events</p>
                                                <p>• {validation.session_count} sessions</p>
                                                {validation.date_range && (
                                                    <p>• Date range: {validation.date_range.start} to {validation.date_range.end}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Warnings */}
                                {validation.warnings.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <svg
                                                className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
                                                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                                                    {validation.warnings.map((warning, i) => (
                                                        <li key={i}>• {warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Session Name Input */}
                                <div>
                                    <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Analysis Name
                                    </label>
                                    <input
                                        id="sessionName"
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="e.g., January 2025 Analysis"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!sessionName.trim() || isSubmitting}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {isSubmitting ? 'Processing...' : 'Start Analysis'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
