/**
 * CSV Data Type Definitions
 * 
 * Types for GA4/Shopify CSV data structure
 */

// ============================================================================
// GA4 EVENT DATA
// ============================================================================

export interface GA4Event {
    session_id: string;
    event_name: string; // "view_item", "add_to_cart", "search", etc.
    event_timestamp: string; // ISO 8601 format

    // Item data (for view_item, add_to_cart events)
    item_id?: string;
    item_name?: string;
    item_category?: string;
    item_price?: number;

    // Page data
    page_location?: string;
    page_title?: string;

    // Search data (for search events)
    search_term?: string;

    // User data
    user_pseudo_id?: string;
}

// ============================================================================
// CSV VALIDATION
// ============================================================================

export interface CSVValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    row_count: number;
    session_count: number;
    date_range?: {
        start: string;
        end: string;
    };
}

// ============================================================================
// PARSED CSV DATA
// ============================================================================

export interface ParsedCSVData {
    events: GA4Event[];
    validation: CSVValidationResult;
    metadata: {
        file_name: string;
        file_size: number;
        uploaded_at: string;
    };
}
