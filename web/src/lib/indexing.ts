import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
const pdf = require('pdf-parse');

/**
 * Core indexing logic - extracts text, chunks, embeds, and stores in DocumentChunk table.
 * Can be called directly (no HTTP) or via the /api/index-rag route.
 */
export async function indexAsset(assetId: string): Promise<{ success: boolean; chunksProcessed: number; error?: string }> {
    try {
        console.log(`[IndexAsset] ========== WORKER STARTED ==========`);
        console.log(`[IndexAsset] Asset ID: ${assetId}`);
        console.log(`[IndexAsset] Timestamp: ${new Date().toISOString()}`);

        // Force Prisma connection to establish before processing
        console.log(`[IndexAsset] Connecting to database...`);
        await prisma.$connect();
        console.log(`[IndexAsset] Database connected!`);

        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });
        console.log(`[IndexAsset] Asset lookup complete:`, asset ? 'Found' : 'Not found');

        if (!asset) {
            console.error(`[IndexAsset] Asset not found: ${assetId}`);
            return { success: false, chunksProcessed: 0, error: 'Asset not found' };
        }

        // 1. Fetch File from Blob Storage
        console.log(`[IndexAsset] Fetching file from: ${asset.url}`);
        const response = await fetch(asset.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Parse Text (PDF or plain text)
        let rawText = '';
        if (asset.name.toLowerCase().endsWith('.pdf')) {
            console.log(`[IndexAsset] Parsing PDF...`);
            const data = await pdf(buffer);
            rawText = data.text;
        } else {
            rawText = buffer.toString('utf-8');
        }
        console.log(`[IndexAsset] Extracted ${rawText.length} characters`);

        // 3. Chunking
        const chunkSize = 1000;
        const overlap = 100;
        const chunks: string[] = [];

        for (let i = 0; i < rawText.length; i += (chunkSize - overlap)) {
            chunks.push(rawText.slice(i, i + chunkSize));
        }
        console.log(`[IndexAsset] Created ${chunks.length} chunks`);

        // 4. Embedding
        if (chunks.length > 0) {
            console.log(`[IndexAsset] Generating embeddings...`);
            const { embeddings } = await embedMany({
                model: google.textEmbeddingModel('text-embedding-004'),
                values: chunks,
            });

            // 5. Store Chunks in Transaction
            console.log(`[IndexAsset] Storing ${chunks.length} chunks in database...`);
            await prisma.$transaction(
                chunks.map((content, index) =>
                    prisma.documentChunk.create({
                        data: {
                            assetId: asset.id,
                            content,
                            chunkIndex: index,
                            embedding: embeddings[index],
                        },
                    })
                )
            );
        }

        // 6. Update Status to READY
        await prisma.asset.update({
            where: { id: assetId },
            data: { status: 'READY' }
        });
        console.log(`[IndexAsset] Asset ${assetId} marked as READY`);

        return { success: true, chunksProcessed: chunks.length };

    } catch (error) {
        console.error(`[IndexAsset] Error indexing asset ${assetId}:`, error);

        // Mark asset as ERROR
        try {
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'ERROR' }
            });
        } catch (updateError) {
            console.error(`[IndexAsset] Failed to update asset status to ERROR:`, updateError);
        }

        return { success: false, chunksProcessed: 0, error: String(error) };
    }
}
