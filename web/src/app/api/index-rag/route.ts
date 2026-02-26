import { NextResponse } from 'next/server';
import { indexAsset } from '@/lib/indexing';
import { apiRateLimiter } from '@/lib/rate-limit';

// Use Node.js runtime because pdf-parse relies on Buffer/fs which are not fully supported in Edge
// Increase maxDuration to prevent timeouts for large PDFs
export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/index-rag
 * Endpoint for triggering RAG indexing on an asset.
 * Can be called externally or used as a fallback if direct function call fails.
 */
export async function POST(request: Request) {
    console.log(`[index-rag] ========== WORKER HIT ==========`);
    console.log(`[index-rag] Timestamp: ${new Date().toISOString()}`);

    // Rate limiting: Prevent abuse of expensive embedding operations
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const { success, remaining } = await apiRateLimiter.limit(ip);

    if (!success) {
        console.warn(`[index-rag] Rate limit exceeded for IP: ${ip}`);
        return NextResponse.json(
            {
                error: 'Too many indexing requests',
                details: 'Please wait a moment before indexing again',
                remainingRequests: remaining
            },
            { status: 429 }
        );
    }

    try {
        const { assetId } = await request.json();

        if (!assetId) {
            return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
        }

        console.log(`[index-rag] Received indexing request for asset: ${assetId}`);

        const result = await indexAsset(assetId);

        if (result.success) {
            return NextResponse.json({ success: true, chunksProcessed: result.chunksProcessed });
        } else {
            return NextResponse.json({ error: result.error || 'Indexing failed' }, { status: 500 });
        }

    } catch (error) {
        console.error("[index-rag] Error:", error);
        return NextResponse.json({ error: 'Indexing failed' }, { status: 500 });
    }
}

