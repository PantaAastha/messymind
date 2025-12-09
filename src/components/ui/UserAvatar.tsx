'use client'

import { useState, useRef, useEffect } from 'react'
import { logout } from '@/app/auth/actions'

interface UserAvatarProps {
    email: string
}

export default function UserAvatar({ email }: UserAvatarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Generate a simple avatar background color based on email
    const getAvatarColor = (email: string) => {
        const colors = [
            'bg-[#03AC13]',
            'bg-[#74B72E]',
            'bg-[#AC039C]',
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
        ]
        const index = email.charCodeAt(0) % colors.length
        return colors[index]
    }

    // Get initials from email
    const getInitials = (email: string) => {
        return email.charAt(0).toUpperCase()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center h-9 w-9 rounded-full ${getAvatarColor(email)} text-white font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer`}
                aria-label="User menu"
            >
                {getInitials(email)}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
                    </div>
                    <form action={logout} className="mt-1">
                        <button
                            type="submit"
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log out
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
