import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('SECURITY ERROR: JWT_SECRET must be set');
}

const secret = new TextEncoder().encode(jwtSecret);

async function verifyAuth(token: string): Promise<boolean> {
    try {
        await jwtVerify(token, secret);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Define public paths that don't require authentication
    const isPublicPath =
        pathname === '/login' ||
        pathname === '/api/auth/login' ||  // Only login endpoint is public
        pathname === '/api/auth/logout' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/uploads/');

    // Get auth token
    const token = req.cookies.get('auth-token')?.value;

    // Verify JWT token
    const isAuthenticated = token ? await verifyAuth(token) : false;

    // Protect all routes except public paths
    if (!isAuthenticated && !isPublicPath) {
        // For API routes, return 401 Unauthorized
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // For page routes, redirect to login
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from login page
    if (isAuthenticated && pathname === '/login') {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
