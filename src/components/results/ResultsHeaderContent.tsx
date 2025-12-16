'use client';

interface ResultsHeaderContentProps {
    dateRangeStart: string;
    dateRangeEnd: string;
}

export default function ResultsHeaderContent({ dateRangeStart, dateRangeEnd }: ResultsHeaderContentProps) {
    // Helper to format date range from ISO dates
    const formatDateRange = (startDate: string, endDate: string): string => {
        try {
            const formatOptions: Intl.DateTimeFormatOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            };
            const start = new Date(startDate).toLocaleDateString('en-US', formatOptions);
            const end = new Date(endDate).toLocaleDateString('en-US', formatOptions);
            return `${start} – ${end}`;
        } catch {
            return 'Date range not available';
        }
    };

    const dateRangeDisplay = dateRangeStart && dateRangeEnd
        ? formatDateRange(dateRangeStart, dateRangeEnd)
        : 'Date range not available';

    return (
        <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-500">{dateRangeDisplay}</div>
            <h1 className="text-lg font-bold text-gray-900">Store-wide Analysis</h1>
        </div>
    );
}
