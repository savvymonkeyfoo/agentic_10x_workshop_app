import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    // 1. Handle missing filename
    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
        return NextResponse.json({ error: 'File body is required' }, { status: 400 });
    }

    // 2. Upload with explicit token
    const blob = await put(filename, request.body, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly use the var we created
    });

    return NextResponse.json(blob);
}
