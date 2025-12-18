import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { indexAsset } from '@/lib/indexing';

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
        console.log("Asset created:", asset.id);

        // 3. Trigger RAG Indexing (Direct Function Call - No HTTP self-call!)
        // This runs synchronously within the same serverless function,
        // avoiding the ECONNREFUSED issue on Vercel.
        console.log("Starting indexing directly...");

        // Fire-and-forget: Start indexing but don't await completion
        // The indexing function handles its own error states and updates asset.status
        indexAsset(asset.id)
            .then(result => {
                console.log(`Indexing complete for ${asset.id}:`, result);
            })
            .catch(err => {
                console.error(`Indexing failed for ${asset.id}:`, err);
            });

        // Return immediately - indexing continues in background
        return NextResponse.json(asset);

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

