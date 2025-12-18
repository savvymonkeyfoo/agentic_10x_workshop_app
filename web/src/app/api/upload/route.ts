import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAssetForRAG } from '@/lib/rag-service';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/upload
 * 
 * Multi-asset upload endpoint supporting the Hybrid RAG Pipeline.
 * 
 * Form Data:
 * - file: File - The file to upload
 * - workshopId: string - The workshop to attach the asset to
 * - assetType: string - "DOSSIER" or "BACKLOG"
 * 
 * Flow:
 * 1. Upload file to Vercel Blob
 * 2. Create Asset record with status: PROCESSING
 * 3. Return asset immediately (async indexing)
 * 4. Trigger RAG processing in background
 */
export async function POST(request: Request): Promise<NextResponse> {
    console.log(`[Upload] ========== New Upload Request ==========`);

    try {
        const form = await request.formData();
        const file = form.get('file') as File;
        const workshopId = form.get('workshopId') as string;
        const assetType = form.get('assetType') as string;

        // Validation
        if (!file || !workshopId || !assetType) {
            console.error('[Upload] Missing required fields:', { file: !!file, workshopId: !!workshopId, assetType: !!assetType });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['DOSSIER', 'BACKLOG'].includes(assetType)) {
            return NextResponse.json({ error: 'Invalid asset type. Must be DOSSIER or BACKLOG' }, { status: 400 });
        }

        console.log(`[Upload] File: ${file.name}, Size: ${file.size}, Type: ${assetType}`);
        console.log(`[Upload] Workshop: ${workshopId}`);

        // 1. Verify workshop exists
        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId }
        });

        if (!workshop) {
            return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
        }

        // 2. Upload to Vercel Blob
        console.log('[Upload] Uploading to Blob...');
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            throw new Error('BLOB_READ_WRITE_TOKEN is missing');
        }

        const blob = await put(file.name, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log('[Upload] Blob URL:', blob.url);

        // 3. Create Asset Record (Status: PROCESSING)
        const asset = await prisma.asset.create({
            data: {
                workshopId,
                name: file.name,
                url: blob.url,
                type: assetType,
                status: 'PROCESSING'
            }
        });
        console.log('[Upload] Asset created:', asset.id);

        // 4. Return asset immediately - don't wait for indexing
        const response = NextResponse.json({
            id: asset.id,
            name: asset.name,
            url: asset.url,
            type: asset.type,
            status: asset.status,
            createdAt: asset.createdAt
        });

        // 5. Trigger RAG processing asynchronously
        // Using setImmediate to ensure response is sent before processing starts
        setImmediate(async () => {
            console.log('[Upload] Starting async RAG processing...');
            const result = await processAssetForRAG(asset.id);
            if (result.success) {
                console.log('[Upload] RAG processing complete');
            } else {
                console.error('[Upload] RAG processing failed:', result.error);
            }
        });

        console.log('[Upload] Returning response (processing continues in background)');
        return response;

    } catch (error) {
        console.error('[Upload] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
