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
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">New Diagnostic Analysis</h1>
                    <p className="text-gray-500">
                        Upload your GA4 event data to detect behavioral friction patterns
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Demo Data Section */}
                    <div className="card p-8 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 border-brand-primary/20">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-accent/10 mb-4">
                                <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Quick Start with Demo Data
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-xl mx-auto">
                                Test the diagnostic tool instantly with synthetic GA4 data containing realistic behavioral patterns
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={handleUseDemoData}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Use Demo Data
                                </button>
                                <button
                                    onClick={handleGenerateSample}
                                    className="btn-secondary inline-flex items-center gap-2 hover:border-brand-secondary hover:text-brand-secondary"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Sample CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10">
                                <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Upload Your GA4 Data
                                </h2>
                                <p className="text-sm text-gray-500">Or drag and drop your CSV file below</p>
                            </div>
                        </div>

                        <FileUploader onUploadComplete={handleUploadComplete} />

                        {/* Validation Results */}
                        {validation && (
                            <div className="mt-8 space-y-4">
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
                                    <label htmlFor="sessionName" className="block text-sm font-medium text-foreground mb-2">
                                        Analysis Name
                                    </label>
                                    <input
                                        id="sessionName"
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="e.g., January 2025 Analysis"
                                        className="input-field"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!sessionName.trim() || isSubmitting}
                                    className="w-full btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-center py-3 inline-flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Start Analysis
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
