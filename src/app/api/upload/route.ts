/**
 * Upload API Route
 * 
 * Handle CSV upload and create diagnostic session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GA4Event, CSVValidationResult } from '@/types/csv';

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
