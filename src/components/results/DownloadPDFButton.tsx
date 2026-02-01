'use client';

import { useState } from 'react';
import { fetchDiagnosticDataForPDF } from '@/app/actions/fetchPDFData';
import { generatePDFReport } from '@/lib/pdf/pdfGenerator';

interface DownloadPDFButtonProps {
    sessionId: string;
}

export default function DownloadPDFButton({ sessionId }: DownloadPDFButtonProps) {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);

        try {
            // Fetch data from server (with auth context)
            const result = await fetchDiagnosticDataForPDF(sessionId);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            const { session, diagnoses } = result.data;

            // Generate PDF on client side using jspdf
            const pdfBlob = generatePDFReport(sessionId, session, diagnoses);

            // Download the PDF
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `messymind-report-${sessionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
            {isGeneratingPDF ? (
                <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                </>
            ) : (
                'Download PDF'
            )}
        </button>
    );
}
