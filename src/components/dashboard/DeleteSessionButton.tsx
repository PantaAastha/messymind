'use client';

import { useState } from 'react';
import { deleteSession } from '@/app/actions/deleteSession';
import { useRouter } from 'next/navigation';

interface DeleteSessionButtonProps {
    sessionId: string;
    sessionName: string;
}

export default function DeleteSessionButton({ sessionId, sessionName }: DeleteSessionButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation to results page
        e.stopPropagation();

        if (!showConfirm) {
            setShowConfirm(true);
            return;
        }

        setIsDeleting(true);
        const result = await deleteSession(sessionId);

        if (result.success) {
            router.refresh(); // Refresh dashboard to show updated list
        } else {
            alert(result.error || 'Failed to delete session');
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(false);
    };

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isDeleting}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all group/delete"
            title={`Delete ${sessionName}`}
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    );
}
