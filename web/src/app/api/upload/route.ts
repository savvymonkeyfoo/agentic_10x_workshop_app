import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const form = await request.formData();
        const file = form.get('file') as File;
        const workshopId = form.get('workshopId') as string;
        const assetType = form.get('assetType') as string;

        if (!file || !workshopId || !assetType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Upload to Vercel Blob
        console.log("Starting Blob Put...");
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
        console.log("Asset created:", asset.id);

        // 3. Trigger RAG Indexing via HTTP (Fire-and-Forget with Dispatch Guard)
        // Use dynamic origin from request.url - works on localhost AND Vercel
        const baseUrl = new URL(request.url).origin;
        console.log("Triggering indexing at:", `${baseUrl}/api/index-rag`);

        // Dispatch guard: Wait briefly to ensure fetch request is initiated
        // before the serverless function returns and potentially terminates
        const indexPromise = fetch(`${baseUrl}/api/index-rag`, {
            method: 'POST',
            body: JSON.stringify({ assetId: asset.id }),
            headers: { 'Content-Type': 'application/json' }
        });

        await Promise.race([
            indexPromise.then(() => console.log("Indexing request dispatched")).catch(err => console.error("Trigger Indexing Failed:", err)),
            new Promise(resolve => setTimeout(resolve, 100)) // Wait max 100ms for dispatch
        ]);

        // Return immediately - indexing continues async
        return NextResponse.json(asset);

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
