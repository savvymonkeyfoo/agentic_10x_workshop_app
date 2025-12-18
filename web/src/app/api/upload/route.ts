import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAssetForRAG } from '@/lib/rag-service';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for upload + indexing

/**
 * POST /api/upload
 * 
 * Multi-asset upload endpoint supporting the Hybrid RAG Pipeline.
 * 
 * ARCHITECTURE NOTE: Synchronous Indexing Pattern
 * ------------------------------------------------
 * Vercel serverless functions terminate immediately after returning a response,
 * killing any background processes. To ensure Pinecone indexing completes,
 * we await the full RAG pipeline before responding.
 * 
 * Trade-off: Upload takes ~5-15 seconds (includes embedding + Pinecone upsert)
 * Benefit: Asset is READY immediately upon response, no polling required.
 * 
 * Form Data:
 * - file: File - The file to upload
 * - workshopId: string - The workshop to attach the asset to
 * - assetType: string - "DOSSIER" or "BACKLOG"
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

        if (!['DOSSIER', 'BACKLOG', 'MARKET_SIGNAL'].includes(assetType)) {
            return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
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

        // 4. SYNCHRONOUS RAG Processing (Critical for Vercel)
        // We MUST await this before returning, otherwise Vercel kills the process
        console.log('[Upload] Starting synchronous RAG processing...');
        const ragResult = await processAssetForRAG(asset.id);

        if (ragResult.success) {
            console.log('[Upload] RAG processing complete - asset is READY');
        } else {
            console.error('[Upload] RAG processing failed:', ragResult.error);
        }

        // 5. Fetch updated asset with final status
        const updatedAsset = await prisma.asset.findUnique({
            where: { id: asset.id }
        });

        console.log(`[Upload] Returning asset with status: ${updatedAsset?.status}`);

        return NextResponse.json({
            id: updatedAsset?.id,
            name: updatedAsset?.name,
            url: updatedAsset?.url,
            type: updatedAsset?.type,
            status: updatedAsset?.status, // Will be READY or ERROR
            createdAt: updatedAsset?.createdAt
        });

    } catch (error) {
        console.error('[Upload] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
