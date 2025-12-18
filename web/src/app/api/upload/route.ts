import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. Force the route to be rendered at request time (Dynamic Rendering)
export const dynamic = 'force-dynamic';

// 2. Use the Node.js runtime for compatibility with 'pdf-parse' and local libraries
export const runtime = 'nodejs';

// 3. Set the maximum execution time to 60 seconds to prevent local timeouts
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const form = await request.formData();
        const file = form.get('file') as File;
        const workshopId = form.get('workshopId') as string;
        const assetType = form.get('assetType') as string; // 'DOSSIER' | 'BACKLOG'

        if (!file || !workshopId || !assetType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Upload to Vercel Blob
        console.log("Starting Blob Put...");
        console.log("Token available:", !!process.env.BLOB_READ_WRITE_TOKEN);
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("BLOB_READ_WRITE_TOKEN is missing!");
            throw new Error("Missing Blob Token");
        }

        const blob = await put(file.name, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log("Blob Put Success:", blob.url);

        // 2. Create Asset Record (Status: INDEXING)
        const asset = await prisma.asset.create({
            data: {
                workshopId,
                name: file.name,
                url: blob.url,
                type: assetType,
                status: 'INDEXING'
            }
        });

        // 3. Trigger RAG Indexing (Fire-and-Forget with Dispatch Guard)
        // Use request.url to dynamically determine the origin (works on localhost AND Vercel)
        const origin = new URL(request.url).origin;
        console.log("Triggering indexing at:", `${origin}/api/index-rag`);

        // Fire-and-forget with dispatch guard: Wait briefly to ensure request is dispatched
        // before the serverless function terminates
        const indexingPromise = fetch(`${origin}/api/index-rag`, {
            method: 'POST',
            body: JSON.stringify({ assetId: asset.id }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Wait up to 500ms for the request to be dispatched (not completed)
        await Promise.race([
            indexingPromise.then(() => console.log("Indexing triggered successfully")).catch(err => console.error("Trigger Indexing Failed:", err)),
            new Promise(resolve => setTimeout(resolve, 500))
        ]);

        return NextResponse.json(asset);

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
