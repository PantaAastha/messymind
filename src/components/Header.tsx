import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

export default async function Header() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <header className="bg-white shadow">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">MessyMind</span>
                        <span className="text-xl font-bold text-blue-600">MessyMind</span>
                    </Link>
                </div>
                <div className="flex flex-1 justify-end gap-x-6">
                    {user ? (
                        <form action={logout}>
                            <button type="submit" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600">
                                Log out <span aria-hidden="true">&rarr;</span>
                            </button>
                        </form>
                    ) : (
                        <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600">
                            Log in <span aria-hidden="true">&rarr;</span>
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    )
}
