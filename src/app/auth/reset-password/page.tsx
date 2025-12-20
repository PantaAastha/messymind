'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        // Check if user has a valid session from the email link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setMessage({
                    type: 'error',
                    text: 'Invalid or expired reset link. Please request a new password reset.'
                })
            }
            setCheckingSession(false)
        }

        checkSession()
    }, [])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (password !== confirmPassword) {
            setMessage({
                type: 'error',
                text: 'Passwords do not match'
            })
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setMessage({
                type: 'error',
                text: 'Password must be at least 6 characters long'
            })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setMessage({
                type: 'success',
                text: 'Password updated successfully! Redirecting to login...'
            })

            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to reset password. Please try again.'
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
                    Set new password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Choose a strong password for your account
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
                <div className="card px-6 py-12 shadow-sm sm:rounded-xl sm:px-10">
                    {checkingSession ? (
                        <div className="text-center">
                            <div className="text-gray-600">Verifying reset link...</div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    New password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                                    Confirm password
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="••••••••"
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
                                    {loading ? 'Updating...' : 'Update password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
