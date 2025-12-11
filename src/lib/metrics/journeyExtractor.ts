/**
 * Journey Extractor
 * 
 * Extract user behavioral journeys from GA4 events for visualization
 */

import type { GA4Event } from '@/types/csv';
import type { JourneyEvent } from '@/types/diagnostics';
import type { SessionMetrics } from '@/types/diagnostics';
import type { DetectionResult } from '@/lib/detection/rulesEngine';
import { parseTimestamp } from '@/lib/csv/parser';

/**
 * Extract journey timeline for a single session
 * 
 * @param sessionId - Session ID to extract journey for
 * @param events - All GA4 events from the diagnostic session
 * @returns Array of journey events sorted by timestamp
 */
export function extractJourneyTimeline(
    sessionId: string,
    events: GA4Event[]
): JourneyEvent[] {
    // Filter events for this session
    const sessionEvents = events.filter(e => e.session_id === sessionId);

    // Filter for relevant event types
    const relevantEvents = sessionEvents.filter(e =>
        e.event_name === 'view_item' ||
        e.event_name === 'add_to_cart' ||
        e.event_name === 'begin_checkout' ||
        (e.page_location && /\/(product|cart|checkout|category|collection)/i.test(e.page_location))
    );

    // Convert to JourneyEvent format
    const journeyEvents: JourneyEvent[] = relevantEvents.map(e => {
        // Determine event type
        let eventType: JourneyEvent['event_type'];
        if (e.event_name === 'view_item') {
            eventType = 'view_item';
        } else if (e.event_name === 'add_to_cart') {
            eventType = 'add_to_cart';
        } else if (e.event_name === 'begin_checkout') {
            eventType = 'begin_checkout';
        } else {
            eventType = 'page_view';
        }

        return {
            timestamp: e.event_timestamp,
            event_type: eventType,
            event_name: e.event_name,
            item_name: e.item_name,
            item_category: e.item_category,
            page_location: e.page_location,
        };
    });

    // Sort by timestamp
    journeyEvents.sort((a, b) => {
        const timeA = parseTimestamp(a.timestamp)?.getTime() || 0;
        const timeB = parseTimestamp(b.timestamp)?.getTime() || 0;
        return timeA - timeB;
    });

    return journeyEvents;
}

/**
 * Find the most representative session for a detected pattern
 * Selects the session with the highest confidence score
 * 
 * @param detectedSessions - Array of session metrics that were detected
 * @param detectionResults - Map of session IDs to detection results
 * @returns Session ID of the representative session
 */
export function findRepresentativeSession(
    detectedSessions: SessionMetrics[],
    detectionResults: Map<string, DetectionResult>
): string | null {
    if (detectedSessions.length === 0) {
        return null;
    }

    // Sort by confidence score (highest first)
    const sorted = [...detectedSessions].sort((a, b) => {
        const resultA = detectionResults.get(a.session_id);
        const resultB = detectionResults.get(b.session_id);
        const scoreA = resultA?.confidenceScore || 0;
        const scoreB = resultB?.confidenceScore || 0;
        return scoreB - scoreA;
    });

    return sorted[0].session_id;
}
