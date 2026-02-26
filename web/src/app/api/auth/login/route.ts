
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';

// Validate required environment variables at startup
const validUser = process.env.BASIC_AUTH_USER;
const validPass = process.env.BASIC_AUTH_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;

if (!validUser || !validPass) {
    throw new Error('SECURITY ERROR: BASIC_AUTH_USER and BASIC_AUTH_PASSWORD must be set');
}

if (!jwtSecret) {
    throw new Error('SECURITY ERROR: JWT_SECRET must be set');
}

const secret = new TextEncoder().encode(jwtSecret);

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Input validation
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        if (username.length > 100 || password.length > 100) {
            return NextResponse.json({ error: 'Input too long' }, { status: 400 });
        }

        // Constant-time comparison to prevent timing attacks
        const userBuf = Buffer.from(username.padEnd(256, '\0'));
        const validUserBuf = Buffer.from(validUser.padEnd(256, '\0'));
        const passBuf = Buffer.from(password.padEnd(256, '\0'));
        const validPassBuf = Buffer.from(validPass.padEnd(256, '\0'));

        let userMatch = false;
        let passMatch = false;

        try {
            userMatch = timingSafeEqual(userBuf, validUserBuf);
            passMatch = timingSafeEqual(passBuf, validPassBuf);
        } catch {
            // Buffers different length, not a match
            userMatch = false;
            passMatch = false;
        }

        if (userMatch && passMatch) {
            // Generate secure JWT token
            const token = await new SignJWT({
                username: validUser,
                iat: Math.floor(Date.now() / 1000),
            })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .setIssuedAt()
            .sign(secret);

            const response = NextResponse.json({ success: true });

            // Set secure httpOnly cookie
            response.cookies.set({
                name: 'auth-token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
