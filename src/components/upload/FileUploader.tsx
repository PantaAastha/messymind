'use client';

/**
 * File Uploader Component
 * 
 * Drag-and-drop file upload with validation and progress
 */

import { useState, useCallback } from 'react';
import { parseCSV, validateGA4Events } from '@/lib/csv/parser';
import type { GA4Event, CSVValidationResult } from '@/types/csv';

interface FileUploaderProps {
    onUploadComplete: (events: GA4Event[], validation: CSVValidationResult) => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setFileName(file.name);
        setIsProcessing(true);

        try {
            // Validate file type
            if (!file.name.endsWith('.csv')) {
                throw new Error('Please upload a CSV file');
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }

            // Parse CSV
            const events = await parseCSV(file);

            // Validate events
            const validation = validateGA4Events(events);

            if (!validation.valid) {
                throw new Error(`Validation failed:\n${validation.errors.join('\n')}`);
            }

            onUploadComplete(events, validation);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process file');
            setFileName(null);
        } finally {
            setIsProcessing(false);
        }
    }, [onUploadComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    return (
        <div className="w-full">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isProcessing}
                />

                <div className="space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>

                    {/* Text */}
                    <div>
                        <p className="text-lg font-medium text-gray-700">
                            {isProcessing ? 'Processing...' : 'Drop your CSV file here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or click to browse
                        </p>
                    </div>

                    {/* File info */}
                    {fileName && !error && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{fileName}</span>
                        </div>
                    )}

                    {/* Requirements */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• CSV format with GA4 event data</p>
                        <p>• Maximum file size: 10MB</p>
                        <p>• Recommended: 20+ sessions</p>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                        <svg
                            className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                            <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
