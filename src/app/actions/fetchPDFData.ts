'use server';

import { fetchDiagnosticData } from '@/lib/pdf/fetchDiagnosticData';

/**
 * Server action to fetch diagnostic data for PDF generation
 * This runs on the server with proper auth context (RLS)
 * Returns plain data that can be used by client-side PDF generator
 */
export async function fetchDiagnosticDataForPDF(sessionId: string) {
    try {
        const { session, diagnoses } = await fetchDiagnosticData(sessionId);

        return {
            success: true,
            data: {
                session,
                diagnoses
            }
        };
    } catch (error) {
        console.error('Failed to fetch diagnostic data for PDF:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch data'
        };
    }
}
