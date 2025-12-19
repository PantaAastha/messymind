/**
 * Shimmer Effect Component
 * 
 * Provides a subtle animated shimmer effect for loading states
 */

interface ShimmerProps {
    className?: string;
}

export function Shimmer({ className = "" }: ShimmerProps) {
    return (
        <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
        </div>
    );
}
