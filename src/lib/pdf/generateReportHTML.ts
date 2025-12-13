import type { DiagnosisOutput } from '@/types/diagnostics';

/**
 * Generate HTML for PDF report
 * Takes diagnostic data and returns HTML string
 */
export function generateReportHTML(
    sessionId: string,
    session: any,
    diagnoses: DiagnosisOutput[]
): string {
    const totalRevenueAtRisk = diagnoses.reduce((sum, d) => sum + (d.revenue_at_risk || 0), 0);
    const formattedTotalRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(totalRevenueAtRisk);

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

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1 { font-size: 28px; margin-bottom: 8px; }
        h2 { font-size: 22px; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        h3 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; }
        .header { border-bottom: 2px solid #d1d5db; padding-bottom: 16px; margin-bottom: 32px; }
        .meta { font-size: 14px; color: #6b7280; margin-top: 8px; }
        .summary { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; }
        .summary-item { margin: 8px 0; }
        .summary-item strong { color: #1f2937; }
        .pattern-list { list-style: decimal; padding-left: 24px; }
        .pattern-item { margin: 16px 0; padding: 12px; background: #f9fafb; border-radius: 6px; }
        .pattern-title { font-weight: 600; color: #1f2937; }
        .pattern-meta { font-size: 14px; color: #6b7280; margin-top: 4px; margin-left: 24px; }
        .detail-section { margin: 32px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
        .detail-header { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #1f2937; }
        .detail-summary { background: #f3f4f6; padding: 12px; border-radius: 4px; margin: 12px 0; font-size: 14px; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
        .metric { background: white; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .metric-value { font-size: 20px; font-weight: 700; color: #1f2937; margin-top: 4px; }
        .drivers { margin: 16px 0; }
        .driver { background: #fef3c7; padding: 12px; margin: 8px 0; border-left: 3px solid #f59e0b; border-radius: 4px; }
        .driver-label { font-weight: 600; font-size: 14px; }
        .driver-desc { font-size: 13px; color: #78350f; margin-top: 4px; }
        .interventions { margin: 16px 0; }
        .intervention { background: #dcfce7; padding: 12px; margin: 12px 0; border-left: 3px solid #22c55e; border-radius: 4px; }
        .intervention-title { font-weight: 600; font-size: 15px; margin-bottom: 8px; }
        .intervention-desc { font-size: 13px; color: #14532d; margin: 4px 0; }
        .quick-wins { margin-top: 8px; padding-left: 20px; }
        .quick-wins li { font-size: 13px; margin: 4px 0; }
        @media print {
          body { padding: 20px; }
          .detail-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MessyMind Diagnostic Report</h1>
        <div class="meta">
          <div>Session ID: ${sessionId}</div>
          <div>Generated: ${new Date().toLocaleDateString()}</div>
          ${session.date_range_start && session.date_range_end ? `
          <div>Period: ${formatDate(session.date_range_start)} – ${formatDate(session.date_range_end)}</div>
          ` : ''}
        </div>
      </div>

      <h2>Executive Summary</h2>
      <div class="summary">
        <div class="summary-item"><strong>Total Patterns Detected:</strong> ${diagnoses.length}</div>
        <div class="summary-item"><strong>Total Revenue at Risk:</strong> ${formattedTotalRevenue}</div>
        <div class="summary-item"><strong>Sessions Analyzed:</strong> ${session.data_quality?.session_count?.toLocaleString() || 'N/A'}</div>
      </div>

      <h2>Patterns Detected</h2>
      <ol class="pattern-list">
        ${diagnoses.map(d => {
        const revenue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(d.revenue_at_risk || 0);

        return `
            <li class="pattern-item">
              <div class="pattern-title">${d.label} – ${revenue} at risk</div>
              <div class="pattern-meta">
                Severity: ${d.severity} | Confidence: ${d.confidence} (${d.confidence_score}%) | 
                Affects ${d.estimated_impact.affected_session_count} sessions (${d.estimated_impact.affected_sessions})
              </div>
            </li>
          `;
    }).join('')}
      </ol>

      <h2>Detailed Pattern Analysis</h2>
      ${diagnoses.map(d => {
        const revenue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(d.revenue_at_risk || 0);

        return `
          <div class="detail-section">
            <div class="detail-header">${d.label}</div>
            <div class="detail-summary">${d.summary || 'Analysis of behavioral friction pattern.'}</div>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-label">Revenue at Risk</div>
                <div class="metric-value" style="color: #dc2626;">${revenue}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Impact Scope</div>
                <div class="metric-value" style="color: #2563eb;">${d.estimated_impact.affected_sessions}</div>
              </div>
            </div>

            ${d.driver_info && d.driver_info.length > 0 ? `
            <h3>Primary Drivers</h3>
            <div class="drivers">
              ${d.driver_info.map(driver => `
                <div class="driver">
                  <div class="driver-label">${driver.label}</div>
                  <div class="driver-desc">${driver.description}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <h3>Recommended Interventions</h3>
            <div class="interventions">
              <div class="intervention">
                <div class="intervention-title">Primary: ${d.intervention_recommendations.primary.label}</div>
                <div class="intervention-desc">${d.intervention_recommendations.primary.description}</div>
                ${d.intervention_recommendations.primary.quick_wins && d.intervention_recommendations.primary.quick_wins.length > 0 ? `
                <ul class="quick-wins">
                  ${d.intervention_recommendations.primary.quick_wins.slice(0, 3).map(win => `<li>${win}</li>`).join('')}
                </ul>
                ` : ''}
              </div>
              <div class="intervention" style="background: #dbeafe; border-color: #3b82f6;">
                <div class="intervention-title">Secondary: ${d.intervention_recommendations.secondary.label}</div>
                <div class="intervention-desc" style="color: #1e3a8a;">${d.intervention_recommendations.secondary.description}</div>
              </div>
            </div>
          </div>
        `;
    }).join('')}
    </body>
    </html>
  `;
}
