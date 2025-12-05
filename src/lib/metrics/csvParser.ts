/**
 * CSV Parser
 * 
 * Parse and validate CSV files containing GA4/Shopify event data
 */

import Papa from 'papaparse';
import type { GA4Event, ParsedCSVData, CSVValidationResult } from '@/types/csv';

/**
 * Parse CSV file and convert to GA4Event format
 */
export async function parseCSV(file: File): Promise<ParsedCSVData> {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const events = results.data.map(transformRowToEvent).filter(Boolean) as GA4Event[];
                    const validation = validateEvents(events);

                    resolve({
                        events,
                        validation,
                        metadata: {
                            file_name: file.name,
                            file_size: file.size,
                            uploaded_at: new Date().toISOString(),
                        },
                    });
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}

/**
 * Transform CSV row to GA4Event
 */
function transformRowToEvent(row: Record<string, string>): GA4Event | null {
    // Handle different possible column names (flexible mapping)
    const sessionId = row.session_id || row.sessionId || row['Session ID'];
    const eventName = row.event_name || row.eventName || row['Event Name'];
    const timestamp = row.event_timestamp || row.timestamp || row['Event Timestamp'];

    if (!sessionId || !eventName || !timestamp) {
        return null; // Skip invalid rows
    }

    return {
        session_id: sessionId,
        event_name: eventName,
        event_timestamp: timestamp,
        item_id: row.item_id || row.itemId || row['Item ID'],
        item_name: row.item_name || row.itemName || row['Item Name'],
        item_category: row.item_category || row.itemCategory || row['Item Category'],
        item_price: row.item_price ? parseFloat(row.item_price) : undefined,
        page_location: row.page_location || row.pageLocation || row['Page Location'],
        page_title: row.page_title || row.pageTitle || row['Page Title'],
        search_term: row.search_term || row.searchTerm || row['Search Term'],
        user_pseudo_id: row.user_pseudo_id || row.userId || row['User ID'],
    };
}

/**
 * Validate parsed events
 */
function validateEvents(events: GA4Event[]): CSVValidationResult {
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

    // Check for required fields
    const sessionsSet = new Set<string>();
    const timestamps: Date[] = [];

    events.forEach((event, index) => {
        if (!event.session_id) {
            errors.push(`Row ${index + 1}: Missing session_id`);
        } else {
            sessionsSet.add(event.session_id);
        }

        if (!event.event_name) {
            errors.push(`Row ${index + 1}: Missing event_name`);
        }

        if (!event.event_timestamp) {
            errors.push(`Row ${index + 1}: Missing event_timestamp`);
        } else {
            try {
                timestamps.push(new Date(event.event_timestamp));
            } catch {
                warnings.push(`Row ${index + 1}: Invalid timestamp format`);
            }
        }
    });

    // Check for essential event types
    const eventTypes = new Set(events.map(e => e.event_name));
    if (!eventTypes.has('view_item')) {
        warnings.push('No "view_item" events found - product view tracking may be missing');
    }
    if (!eventTypes.has('add_to_cart')) {
        warnings.push('No "add_to_cart" events found - cart tracking may be missing');
    }

    // Calculate date range
    let dateRange: { start: string; end: string } | undefined;
    if (timestamps.length > 0) {
        const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());
        dateRange = {
            start: sortedTimestamps[0].toISOString(),
            end: sortedTimestamps[sortedTimestamps.length - 1].toISOString(),
        };
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        row_count: events.length,
        session_count: sessionsSet.size,
        date_range: dateRange,
    };
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
    const headers = [
        'session_id',
        'event_name',
        'event_timestamp',
        'item_id',
        'item_name',
        'item_category',
        'item_price',
        'page_location',
        'search_term',
    ];

    const sampleRows = [
        [
            'session_123',
            'view_item',
            '2025-01-15T10:30:00Z',
            'prod_001',
            'Running Shoes Pro',
            'Running Shoes',
            '129.99',
            '/products/running-shoes-pro',
            '',
        ],
        [
            'session_123',
            'view_item',
            '2025-01-15T10:32:00Z',
            'prod_002',
            'Trail Runner X',
            'Running Shoes',
            '149.99',
            '/products/trail-runner-x',
            '',
        ],
        [
            'session_123',
            'search',
            '2025-01-15T10:33:00Z',
            '',
            '',
            '',
            '',
            '/search',
            'waterproof running shoes',
        ],
        [
            'session_123',
            'add_to_cart',
            '2025-01-15T10:35:00Z',
            'prod_001',
            'Running Shoes Pro',
            'Running Shoes',
            '129.99',
            '/products/running-shoes-pro',
            '',
        ],
    ];

    return [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
}
