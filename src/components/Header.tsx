import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

export default async function Header() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5 flex items-center group">
                        <div className="relative h-16 w-16 transition-transform group-hover:scale-105">
                            <Image
                                src="/logo.png"
                                alt="MessyMind"
                                width={64}
                                height={64}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>
                </div>
                <div className="flex flex-1 justify-end gap-x-4 items-center">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#AC039C] transition-colors group cursor-pointer"
                                    title="Log out"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="hidden sm:inline">Log out</span>
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#AC039C] transition-colors cursor-pointer">
                                Log in
                            </Link>
                            <Link href="/signup" className="bg-[#03AC13] text-white font-medium px-4 py-2 rounded-md hover:bg-[#74B72E] transition-all shadow-sm text-sm cursor-pointer">
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    )
}
