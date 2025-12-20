'use client'

import { useActionState } from 'react'
import { login } from '@/app/auth/actions'
import Link from 'next/link'
import Image from 'next/image'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(async (_: any, formData: FormData) => {
        return await login(formData);
    }, initialState)

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
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link href="/signup" className="font-medium text-[#AC039C] hover:text-[#74B72E] transition-colors cursor-pointer">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
                <div className="card px-6 py-12 shadow-sm sm:rounded-xl sm:px-10">
                    <form className="space-y-6" action={formAction}>
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
                                    className="input-field"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password
                                </label>
                                <div className="text-sm">
                                    <Link href="/forgot-password" className="font-medium text-[#AC039C] hover:text-[#74B72E] transition-colors cursor-pointer">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="input-field"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {state?.error && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{state.error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex w-full justify-center rounded-md bg-[#03AC13] px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#74B72E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03AC13] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isPending ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
