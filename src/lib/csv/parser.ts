/**
 * CSV Parser and Validator
 * 
 * Parse and validate GA4 CSV files
 */

import type { GA4Event, CSVValidationResult } from '@/types/csv';

/**
 * Parse CSV string to GA4Event array
 */
export async function parseCSV(file: File): Promise<GA4Event[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const events: GA4Event[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length !== headers.length) {
            console.warn(`Row ${i + 1}: Column count mismatch, skipping`);
            continue;
        }

        const event: Partial<GA4Event> = {};

        headers.forEach((header, index) => {
            const value = values[index];
            if (value === '') return;

            switch (header) {
                case 'session_id':
                case 'event_name':
                case 'event_timestamp':
                case 'item_id':
                case 'item_name':
                case 'item_category':
                case 'page_location':
                case 'page_title':
                case 'search_term':
                case 'user_pseudo_id':
                    event[header] = value;
                    break;
                case 'item_price':
                    event.item_price = parseFloat(value);
                    break;
            }
        });

        if (event.session_id && event.event_name && event.event_timestamp) {
            events.push(event as GA4Event);
        }
    }

    return events;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Validate GA4 events
 */
export function validateGA4Events(events: GA4Event[]): CSVValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (events.length === 0) {
        errors.push('No valid events found in CSV');
        return {
            valid: false,
            errors,
            warnings,
            row_count: 0,
            session_count: 0,
        };
    }

    // Check required fields
    const requiredFields: (keyof GA4Event)[] = ['session_id', 'event_name', 'event_timestamp'];

    events.forEach((event, index) => {
        requiredFields.forEach(field => {
            if (!event[field]) {
                errors.push(`Row ${index + 2}: Missing required field '${field}'`);
            }
        });

        // Validate timestamp format
        if (event.event_timestamp) {
            const date = new Date(event.event_timestamp);
            if (isNaN(date.getTime())) {
                errors.push(`Row ${index + 2}: Invalid timestamp format`);
            }
        }

        // Validate price if present
        if (event.item_price !== undefined && (isNaN(event.item_price) || event.item_price < 0)) {
            warnings.push(`Row ${index + 2}: Invalid item_price value`);
        }
    });

    // Get unique sessions
    const sessions = new Set(events.map(e => e.session_id));
    const sessionCount = sessions.size;

    if (sessionCount < 5) {
        warnings.push(`Only ${sessionCount} sessions found. Recommend at least 20 sessions for reliable analysis.`);
    }

    // Detect date range
    const dateRange = detectDateRange(events);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        row_count: events.length,
        session_count: sessionCount,
        date_range: dateRange,
    };
}

/**
 * Detect date range from events
 */
export function detectDateRange(events: GA4Event[]): { start: string; end: string } | undefined {
    if (events.length === 0) return undefined;

    const timestamps = events
        .map(e => new Date(e.event_timestamp).getTime())
        .filter(t => !isNaN(t));

    if (timestamps.length === 0) return undefined;

    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    return {
        start: minDate.toISOString().split('T')[0],
        end: maxDate.toISOString().split('T')[0],
    };
}

/**
 * Get session count from events
 */
export function getSessionCount(events: GA4Event[]): number {
    const sessions = new Set(events.map(e => e.session_id));
    return sessions.size;
}
