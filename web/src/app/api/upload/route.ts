import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    // 1. Parse the FormData directly (Standard Web API)
    const form = await request.formData();
    const file = form.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2. Upload using the file's own name
    const blob = await put(file.name, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
}
