import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
    // 🚧 AUTHENTICATION DISABLED FOR DEVELOPMENT 🚧
    // TODO: Re-enable authentication before production deployment
    // To re-enable: uncomment the code below and remove this bypass

    return NextResponse.next(); // Bypass all auth checks

    /* COMMENTED OUT FOR DEVELOPMENT - UNCOMMENT TO RE-ENABLE AUTH
    const { pathname } = req.nextUrl;

    // Check for cookie
    const hasAuth = req.cookies.has('auth-token');

    // Define protected routes (exclude public assets + api + login)
    // Actually, we want to protect EVERYTHING except specific public paths
    const isPublicPath =
        pathname === '/login' ||
        pathname.startsWith('/api/') || // Keep API open for internal fetches (or protect explicit routes)
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/uploads/'); // Assuming images are public

    if (!hasAuth && !isPublicPath) {
        // Redirect unauthenticated users to login
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (hasAuth && pathname === '/login') {
        // Redirect authenticated users away from login
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
    */
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
