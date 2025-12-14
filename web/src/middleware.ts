import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    // 1. Check for the Authorization header
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        // 2. Verify against Environment Variables
        // (Defaults to admin/workshop2025 if variables are missing, just for safety)
        const validUser = process.env.BASIC_AUTH_USER || 'admin';
        const validPass = process.env.BASIC_AUTH_PASSWORD || 'workshop2026';

        if (user === validUser && pwd === validPass) {
            return NextResponse.next();
        }
    }

    // 3. If no auth or wrong password, block access
    return new NextResponse('Authentication Required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    });
}

// Protect all routes except public assets (images, api, etc)
export const config = {
    matcher: [
        // Match all paths except static files, images, and favicon
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
