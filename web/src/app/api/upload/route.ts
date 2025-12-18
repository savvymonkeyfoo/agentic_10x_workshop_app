import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { indexAsset } from '@/lib/indexing';

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
        console.log("[Upload] Starting Blob Put...");
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("[Upload] BLOB_READ_WRITE_TOKEN is missing!");
            throw new Error("Missing Blob Token");
        }

        const blob = await put(file.name, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log("[Upload] Blob Put Success:", blob.url);

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
        console.log("[Upload] Asset created:", asset.id);

        // 3. Index Synchronously (No background worker!)
        // For small files (<100KB), this completes well within the 60s timeout
        console.log("[Upload] Starting synchronous indexing...");
        const result = await indexAsset(asset.id);
        console.log("[Upload] Indexing result:", result);

        // 4. Fetch updated asset with final status
        const updatedAsset = await prisma.asset.findUnique({
            where: { id: asset.id }
        });

        return NextResponse.json(updatedAsset);

    } catch (error) {
        console.error("[Upload] Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
