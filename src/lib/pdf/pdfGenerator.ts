import { jsPDF } from 'jspdf';
import type { DiagnosisOutput } from '@/types/diagnostics';

interface DiagnosticSession {
    id: string;
    date_range_start?: string;
    date_range_end?: string;
    data_quality?: {
        session_count?: number;
    };
}

/**
 * Generate PDF report on the client side using jspdf
 * Takes diagnostic data and returns a Blob
 */
export function generatePDFReport(
    sessionId: string,
    session: DiagnosticSession,
    diagnoses: DiagnosisOutput[]
): Blob {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper: format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Helper: format date
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Helper: check if we need a new page
    const checkPageBreak = (neededHeight: number) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (yPos + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    // Helper: add wrapped text and return new Y position
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
    };

    // === HEADER ===
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MessyMind Diagnostic Report', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Session ID: ${sessionId}`, margin, yPos);
    yPos += 5;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 5;

    if (session.date_range_start && session.date_range_end) {
        doc.text(`Period: ${formatDate(session.date_range_start)} – ${formatDate(session.date_range_end)}`, margin, yPos);
        yPos += 5;
    }

    // Divider line
    yPos += 3;
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // === EXECUTIVE SUMMARY ===
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, yPos);
    yPos += 8;

    const totalRevenueAtRisk = diagnoses.reduce((sum, d) => sum + (d.revenue_at_risk || 0), 0);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Summary box
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos - 3, contentWidth, 25, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 3, margin, yPos + 22);

    yPos += 2;
    doc.text(`Total Patterns Detected: ${diagnoses.length}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Total Revenue at Risk: ${formatCurrency(totalRevenueAtRisk)}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Sessions Analyzed: ${session.data_quality?.session_count?.toLocaleString() || 'N/A'}`, margin + 5, yPos);
    yPos += 15;

    // === PATTERNS OVERVIEW ===
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Patterns Detected', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    diagnoses.forEach((d, index) => {
        checkPageBreak(25);

        const revenue = formatCurrency(d.revenue_at_risk || 0);

        // Pattern name (may wrap if long)
        doc.setFont('helvetica', 'bold');
        const labelText = `${index + 1}. ${d.label}`;
        yPos = addWrappedText(labelText, margin, yPos, contentWidth - 40, 5);

        // Revenue on same line as last line of label, right-aligned
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 38, 38);
        doc.text(`${revenue} at risk`, pageWidth - margin, yPos - 5, { align: 'right' });
        doc.setTextColor(0);

        doc.setFontSize(9);
        doc.setTextColor(100);
        const meta = `Severity: ${d.severity} | Confidence: ${d.confidence} (${d.confidence_score}%) | Affects ${d.estimated_impact.affected_session_count} sessions`;
        doc.text(meta, margin + 5, yPos);
        yPos += 8;
        doc.setTextColor(0);
        doc.setFontSize(11);
    });

    // === DETAILED ANALYSIS ===
    yPos += 5;
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Pattern Analysis', margin, yPos);
    yPos += 10;

    diagnoses.forEach((d) => {
        checkPageBreak(80);

        // Pattern header
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos - 3, contentWidth, 10, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(d.label, margin + 3, yPos + 3);
        yPos += 12;

        // Summary
        if (d.summary) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60);
            yPos = addWrappedText(d.summary, margin, yPos, contentWidth, 4);
            yPos += 3;
        }

        // Metrics
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Revenue at Risk:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 38, 38);
        doc.text(formatCurrency(d.revenue_at_risk || 0), margin + 35, yPos);

        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Impact Scope:', margin + 70, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(37, 99, 235);
        doc.text(d.estimated_impact.affected_sessions, margin + 100, yPos);
        doc.setTextColor(0);
        yPos += 8;

        // Drivers
        if (d.driver_info && d.driver_info.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Primary Drivers:', margin, yPos);
            yPos += 5;

            d.driver_info.forEach(driver => {
                checkPageBreak(15);
                doc.setFillColor(254, 243, 199);
                doc.rect(margin, yPos - 2, contentWidth, 10, 'F');
                doc.setDrawColor(245, 158, 11);
                doc.setLineWidth(0.5);
                doc.line(margin, yPos - 2, margin, yPos + 8);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(driver.label, margin + 3, yPos + 2);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(120, 53, 15);
                yPos = addWrappedText(driver.description, margin + 3, yPos + 6, contentWidth - 6, 3.5);
                doc.setTextColor(0);
                yPos += 4;
            });
        }

        // Interventions
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommended Interventions:', margin, yPos);
        yPos += 6;

        // Primary intervention
        const primary = d.intervention_recommendations.primary;
        if (primary) {
            checkPageBreak(25);
            doc.setFillColor(220, 252, 231);
            doc.rect(margin, yPos - 2, contentWidth, 18, 'F');
            doc.setDrawColor(34, 197, 94);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos - 2, margin, yPos + 16);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Primary: ${primary.label}`, margin + 3, yPos + 2);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(20, 83, 45);
            yPos = addWrappedText(primary.description, margin + 3, yPos + 7, contentWidth - 6, 3.5);
            doc.setTextColor(0);
            yPos += 6;
        }

        // Secondary intervention
        const secondary = d.intervention_recommendations.secondary;
        if (secondary) {
            checkPageBreak(20);
            doc.setFillColor(219, 234, 254);
            doc.rect(margin, yPos - 2, contentWidth, 15, 'F');
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos - 2, margin, yPos + 13);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Secondary: ${secondary.label}`, margin + 3, yPos + 2);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(30, 58, 138);
            yPos = addWrappedText(secondary.description, margin + 3, yPos + 7, contentWidth - 6, 3.5);
            doc.setTextColor(0);
            yPos += 6;
        }

        yPos += 10;
    });

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
        doc.text(
            'MessyMind Diagnostic Report',
            pageWidth / 2,
            10,
            { align: 'center' }
        );
    }

    return doc.output('blob');
}
