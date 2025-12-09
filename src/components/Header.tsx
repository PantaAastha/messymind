import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import UserAvatar from '@/components/ui/UserAvatar'

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
                        <div className="relative h-14 w-14 transition-transform group-hover:scale-105">
                            <Image
                                src="/MMlogo.png"
                                alt="MessyMind"
                                width={56}
                                height={56}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>
                </div>
                <div className="flex flex-1 justify-end gap-x-4 items-center">
                    {user ? (
                        <UserAvatar email={user.email || 'user@example.com'} />
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
