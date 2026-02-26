import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAssetForRAG } from '@/lib/rag-service';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // Allow up to 5 minutes for upload + indexing large files

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
// File size limits (in bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images

// Allowed MIME types for RAG uploads
const ALLOWED_RAG_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
];

// Allowed MIME types for generic uploads (images)
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
];

export async function POST(request: Request): Promise<NextResponse> {
    console.log(`[Upload] ========== New Upload Request ==========`);

    try {
        const form = await request.formData();
        const file = form.get('file') as File;
        const workshopId = form.get('workshopId') as string;
        const assetType = form.get('assetType') as string;

        // Validation
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size limit
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: 'File too large',
                details: `Maximum file size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
            }, { status: 413 });
        }

        // ---------------------------------------------------------
        // PATH A: GENERIC UPLOAD (e.g. Client Logo)
        // If workshopId or assetType is missing, treat as simple upload
        // ---------------------------------------------------------
        if (!workshopId || !assetType) {
            console.log('[Upload] Generic upload detected (no workshopId/assetType). Processing as simple file...');

            // Validate file type (images only for generic uploads)
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                console.error('[Upload] Generic upload rejected: Invalid file type:', file.type);
                return NextResponse.json({
                    error: 'Invalid file type',
                    details: 'Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed for generic uploads',
                    allowedTypes: ALLOWED_IMAGE_TYPES
                }, { status: 400 });
            }

            // Validate image size
            if (file.size > MAX_IMAGE_SIZE) {
                return NextResponse.json({
                    error: 'Image too large',
                    details: `Maximum image size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
                }, { status: 413 });
            }

            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                throw new Error('BLOB_READ_WRITE_TOKEN is missing');
            }

            const blob = await put(file.name, file, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
                addRandomSuffix: true,
            });

            console.log('[Upload] Generic upload complete:', blob.url);
            return NextResponse.json({ url: blob.url });
        }

        // ---------------------------------------------------------
        // PATH B: RAG ASSET UPLOAD
        // ---------------------------------------------------------

        if (!['DOSSIER', 'BACKLOG', 'MARKET_SIGNAL'].includes(assetType)) {
            return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
        }

        // Validate file type for RAG uploads (documents only)
        if (!ALLOWED_RAG_TYPES.includes(file.type)) {
            console.error('[Upload] RAG upload rejected: Invalid file type:', file.type);
            return NextResponse.json({
                error: 'Invalid file type for RAG upload',
                details: 'Only PDF, TXT, MD, DOC, and DOCX files are allowed for document uploads',
                allowedTypes: ALLOWED_RAG_TYPES
            }, { status: 400 });
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
            addRandomSuffix: true, // Prevent duplicate filename errors
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[Upload] Error:', errorMessage);
        return NextResponse.json({
            error: 'Upload failed',
            details: errorMessage
        }, { status: 500 });
    }
}
