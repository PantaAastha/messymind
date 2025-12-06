/**
 * Upload API Route
 * 
 * Handle CSV upload, create diagnostic session, and calculate metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GA4Event, CSVValidationResult } from '@/types/csv';
import { groupEventsBySession } from '@/lib/metrics/grouping';
import { calculateSessionMetrics, calculateAggregateMetrics } from '@/lib/metrics/calculator';

export async function POST(request: NextRequest) {
    console.log('📤 Upload API called');

    try {
        const body = await request.json();
        console.log('📦 Request body received:', {
            hasName: !!body.name,
            hasEvents: !!body.events,
            eventsCount: body.events?.length,
            hasValidation: !!body.validation
        });

        const { name, events, validation } = body as {
            name: string;
            events: GA4Event[];
            validation: CSVValidationResult;
        };

        // Validate input
        if (!name || !events || !validation) {
            console.error('❌ Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // For now, we'll use a placeholder user_id
        const userId = '00000000-0000-0000-0000-000000000000';

        console.log('🔧 Creating Supabase client...');
        const supabase = await createClient();

        console.log('💾 Inserting session to database...');
        const insertData = {
            user_id: userId,
            name,
            data_source: 'csv_upload' as const,
            date_range_start: validation.date_range?.start || null,
            date_range_end: validation.date_range?.end || null,
            raw_data: events,
            data_quality: {
                sample_size: validation.row_count,
                session_count: validation.session_count,
                coverage: 'complete',
                date_range: validation.date_range
                    ? `${validation.date_range.start} to ${validation.date_range.end}`
                    : 'unknown',
            },
        };

        console.log('📝 Insert data prepared:', {
            user_id: insertData.user_id,
            name: insertData.name,
            data_source: insertData.data_source,
            eventsCount: insertData.raw_data.length,
        });

        const { data: session, error: sessionError } = await supabase
            .from('diagnostic_sessions')
            .insert(insertData)
            .select()
            .single();

        if (sessionError) {
            console.error('❌ Session creation error:', sessionError);
            return NextResponse.json(
                {
                    error: 'Failed to create diagnostic session',
                    details: sessionError.message,
                    code: sessionError.code
                },
                { status: 500 }
            );
        }

        console.log('✅ Session created successfully:', session.id);

        // Calculate metrics automatically
        console.log('📊 Calculating metrics...');

        try {
            // Group events by session_id
            const sessionGroups = groupEventsBySession(events);

            // Calculate metrics for each session
            const sessionMetrics = Array.from(sessionGroups.entries()).map(([sessionId, sessionEvents]) =>
                calculateSessionMetrics(sessionId, sessionEvents)
            );

            console.log(`✅ Calculated metrics for ${sessionMetrics.length} sessions`);

            // Calculate aggregate metrics (store-level)
            const aggregateMetrics = calculateAggregateMetrics(
                sessionMetrics,
                'store',
                'All products',
                validation.date_range?.start,
                validation.date_range?.end
            );

            console.log('✅ Calculated aggregate metrics');

            // Update session with metrics
            const { error: updateError } = await supabase
                .from('diagnostic_sessions')
                .update({
                    session_metrics: sessionMetrics,
                    aggregate_metrics: aggregateMetrics,
                })
                .eq('id', session.id);

            if (updateError) {
                console.error('⚠️  Failed to save metrics:', updateError);
                // Don't fail the request, metrics can be recalculated later
            } else {
                console.log('✅ Metrics saved to database');
            }

            // Run pattern detection automatically
            console.log('🔍 Running pattern detection...');

            try {
                const { runDiagnostics } = await import('@/lib/diagnostic/runner');
                const diagnoses = await runDiagnostics(session.id);
                console.log(`✅ Pattern detection complete: ${diagnoses.length} patterns detected`);
            } catch (diagnosticError) {
                console.error('⚠️  Pattern detection error:', diagnosticError);
                // Don't fail the request, diagnostics can be run later
            }
        } catch (metricsError) {
            console.error('⚠️  Metrics calculation error:', metricsError);
            // Don't fail the request, metrics can be calculated later
        }

        return NextResponse.json({
            sessionId: session.id,
            message: 'Upload successful',
        });
    } catch (error) {
        console.error('💥 Upload error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
