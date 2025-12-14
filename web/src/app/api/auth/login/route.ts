
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Check against env variable (default to workshop2026 for safety fallback)
        const validUser = process.env.BASIC_AUTH_USER || 'admin';
        const validPass = process.env.BASIC_AUTH_PASSWORD || 'workshop2026';

        if (username === validUser && password === validPass) {
            const response = NextResponse.json({ success: true });

            // Set httpOnly cookie
            response.cookies.set({
                name: 'auth-token',
                value: 'authenticated',
                httpOnly: true,
                path: '/',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
