'use client';

import React from 'react';
import type { JourneyEvent } from '@/types/diagnostics';

interface BehavioralFingerprintProps {
    journeyTimeline?: JourneyEvent[];
    patternType: string;
}

// Map event types to emoji icons
const getEventIcon = (eventType: JourneyEvent['event_type'], eventName?: string): string => {
    if (eventName === 'search') return '🔍';

    switch (eventType) {
        case 'page_view':
            return '🏠';
        case 'view_item':
            return '👟';
        case 'add_to_cart':
            return '🛒';
        case 'begin_checkout':
            return '💳';
        default:
            return '📄';
    }
};

// Get label for event
const getEventLabel = (event: JourneyEvent): string => {
    if (event.event_name === 'search') return 'Search';
    if (event.item_name) return event.item_name.substring(0, 20);
    if (event.event_type === 'page_view') return 'Home';
    if (event.event_type === 'add_to_cart') return 'Add to Cart';
    if (event.event_type === 'begin_checkout') return 'Checkout';
    return 'Page View';
};

// Format timestamp for display
const formatTime = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return '';
    }
};

export function BehavioralFingerprint({ journeyTimeline, patternType }: BehavioralFingerprintProps) {
    if (!journeyTimeline || journeyTimeline.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
                No journey data available for this session
            </div>
        );
    }

    // Limit to most relevant events (max 12 to avoid overwhelming)
    const displayEvents = journeyTimeline.slice(0, 12);
    const hasMore = journeyTimeline.length > 12;

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Behavioral Pattern
            </h4>

            {/* Journey Timeline */}
            <div className="relative">
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
                    {displayEvents.map((event, idx) => (
                        <React.Fragment key={idx}>
                            {/* Event Node */}
                            <div className="flex flex-col items-center min-w-[80px] group">
                                {/* Icon */}
                                <div className="relative">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-purple-200 group-hover:scale-110 transition-transform cursor-pointer">
                                        {getEventIcon(event.event_type, event.event_name)}
                                    </div>

                                    {/* Hover Tooltip - Only show if there's additional info */}
                                    {(event.item_name || event.item_category) && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg max-w-xs">
                                                {event.item_name && (
                                                    <div className="font-semibold mb-0.5">{event.item_name}</div>
                                                )}
                                                {event.item_category && (
                                                    <div className="text-gray-300 text-[11px]">{event.item_category}</div>
                                                )}
                                                <div className="text-gray-400 text-[10px] mt-1">{formatTime(event.timestamp)}</div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <div className="text-[10px] text-gray-600 mt-1 text-center leading-tight max-w-[80px] truncate">
                                    {getEventLabel(event)}
                                </div>

                                {/* Time */}
                                <div className="text-[9px] text-gray-400">
                                    {formatTime(event.timestamp)}
                                </div>
                            </div>

                            {/* Arrow between events */}
                            {idx < displayEvents.length - 1 && (
                                <div className="flex-shrink-0 text-purple-300 text-xl">
                                    →
                                </div>
                            )}
                        </React.Fragment>
                    ))}

                    {/* Exit indicator */}
                    <div className="flex flex-col items-center min-w-[80px]">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-2xl shadow-sm border border-red-200">
                            ❌
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1 text-center">
                            Exit
                        </div>
                    </div>

                    {hasMore && (
                        <div className="flex-shrink-0 text-gray-400 text-xs ml-2">
                            +{journeyTimeline.length - 12} more
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-4 text-xs text-purple-700 bg-white/60 rounded px-3 py-2 border border-purple-100">
                    <span className="font-medium">Pattern:</span> User viewed {journeyTimeline.filter(e => e.event_type === 'view_item').length} products but didn't convert
                </div>
            </div>
        </div>
    );
}
