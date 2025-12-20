'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) throw error

            setMessage({
                type: 'success',
                text: 'Password reset email sent! Check your inbox for the reset link.'
            })
            setEmail('')
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to send reset email. Please try again.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-28 w-28 relative mb-6">
                    <Image
                        src="/MMlogo.png"
                        alt="MessyMind"
                        width={112}
                        height={112}
                        className="object-contain"
                        priority
                    />
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset your password
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
                <div className="card px-6 py-12 shadow-sm sm:rounded-xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleResetPassword}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`rounded-md p-4 border ${message.type === 'success'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className={`text-sm ${message.type === 'success'
                                            ? 'text-green-800'
                                            : 'text-red-800'
                                            }`}>
                                            {message.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center rounded-md bg-[#03AC13] px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#74B72E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03AC13] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-[#AC039C] hover:text-[#74B72E] transition-colors cursor-pointer"
                            >
                                ← Back to login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
