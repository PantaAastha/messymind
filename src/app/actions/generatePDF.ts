'use server';

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { fetchDiagnosticData } from '@/lib/pdf/fetchDiagnosticData';
import { generateReportHTML } from '@/lib/pdf/generateReportHTML';

/**
 * Generate PDF report for a diagnostic session
 * Fetches data with auth, generates HTML, and converts to PDF
 */
export async function generateReportPDF(sessionId: string): Promise<string> {
    try {
        console.log('🖨️  Starting PDF generation for session:', sessionId);

        // 1. Fetch diagnostic data (with auth context - solves RLS issue!)
        console.log('📡 Fetching diagnostic data with auth...');
        const { session, diagnoses } = await fetchDiagnosticData(sessionId);

        console.log('✅ Data fetched:', {
            sessionId: session.id,
            diagnosesCount: diagnoses.length,
            totalRevenue: diagnoses.reduce((sum, d) => sum + (d.revenue_at_risk || 0), 0)
        });

        // 2. Generate HTML from data
        console.log('📝 Generating HTML...');
        const html = generateReportHTML(sessionId, session, diagnoses);

        // 3. Launch browser
        console.log('🚀 Launching Puppeteer...');
        const isDev = process.env.NODE_ENV === 'development';
        const isLocal = !process.env.VERCEL;

        let browser;

        if (isDev || isLocal) {
            // Local development - use system Chrome
            const executablePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                process.env.CHROME_PATH || '',
            ].filter(Boolean);

            browser = await puppeteer.launch({
                executablePath: executablePaths[0],
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        } else {
            // Production (Vercel) - use @sparticuz/chromium
            browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath(),
                headless: true,
            });
        }

        const page = await browser.newPage();

        // 4. Load HTML directly (no navigation - no auth issues!)
        console.log('📄 Loading HTML content...');
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 15000
        });

        // 5. Generate PDF
        console.log('📋 Generating PDF...');
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `
        <div style="font-size: 9pt; width: 100%; text-align: center; color: #666; padding: 5px;">
          <span style="font-weight: 600;">MessyMind Diagnostic Report</span>
        </div>
      `,
            footerTemplate: `
        <div style="font-size: 9pt; width: 100%; text-align: center; color: #666; padding: 5px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
        });

        await browser.close();
        console.log('✅ PDF generated successfully!');

        // Convert to base64 for transfer
        return Buffer.from(pdf).toString('base64');

    } catch (error) {
        console.error('❌ PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
