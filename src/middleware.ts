import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Public paths that don't require authentication
    const publicPaths = [
        '/auth/login',
        '/auth/signup',
        '/auth/callback',
        '/reports/.*/print', // Allow PDF print routes for Puppeteer
    ];

    const isPublicPath = publicPaths.some(path => {
        const regex = new RegExp(`^${path}$`);
        return regex.test(request.nextUrl.pathname);
    });

    if (isPublicPath) {
        return NextResponse.next();
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
