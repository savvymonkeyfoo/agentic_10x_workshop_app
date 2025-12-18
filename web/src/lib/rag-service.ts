import { prisma } from '@/lib/prisma';
import { getWorkshopNamespace } from '@/lib/pinecone';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { del } from '@vercel/blob';

/**
 * RAG Service for processing assets and managing vector embeddings.
 * Handles text extraction, chunking, embedding, and Pinecone storage.
 */

// Constants
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;
const EMBEDDING_DIMENSION = 768;

/**
 * Extract text from a file buffer based on file type.
 * Supports PDF and plain text formats.
 */
async function extractText(buffer: Buffer, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop();

    if (extension === 'pdf') {
        // Dynamic import to avoid bundling issues
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
    }

    // Plain text files (md, txt, csv, etc.)
    return buffer.toString('utf-8');
}

/**
 * Split text into overlapping chunks for embedding.
 */
function chunkText(text: string): string[] {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += (CHUNK_SIZE - CHUNK_OVERLAP)) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    return chunks;
}

/**
 * Generate embeddings for text chunks using Gemini.
 * Returns 768-dimensional vectors.
 */
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
    if (chunks.length === 0) return [];

    console.log(`[RAG] Generating embeddings for ${chunks.length} chunks...`);

    const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('text-embedding-004'),
        values: chunks,
    });

    console.log(`[RAG] Generated ${embeddings.length} embeddings (dim: ${embeddings[0]?.length || 0})`);
    return embeddings;
}

/**
 * Main RAG processing function.
 * Fetches file, extracts text, generates embeddings, and upserts to Pinecone.
 */
export async function processAssetForRAG(assetId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[RAG] ========== Processing Asset: ${assetId} ==========`);

    try {
        // 1. Fetch asset from database
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            include: { workshop: true }
        });

        if (!asset) {
            throw new Error(`Asset not found: ${assetId}`);
        }

        console.log(`[RAG] Asset: ${asset.name}, Type: ${asset.type}, Workshop: ${asset.workshopId}`);

        // 2. Fetch file from Blob storage
        console.log(`[RAG] Fetching file from: ${asset.url}`);
        const response = await fetch(asset.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`[RAG] Fetched ${buffer.length} bytes`);

        // 3. Extract text
        console.log(`[RAG] Extracting text...`);
        const rawText = await extractText(buffer, asset.name);
        console.log(`[RAG] Extracted ${rawText.length} characters`);

        // 4. Chunk text
        const chunks = chunkText(rawText);
        console.log(`[RAG] Created ${chunks.length} chunks`);

        if (chunks.length === 0) {
            console.log(`[RAG] No chunks to process, marking as READY`);
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'READY' }
            });
            return { success: true };
        }

        // 5. Generate embeddings
        const embeddings = await generateEmbeddings(chunks);

        // 6. Upsert to Pinecone with workshop namespace
        console.log(`[RAG] Upserting to Pinecone namespace: ${asset.workshopId}`);
        const namespace = getWorkshopNamespace(asset.workshopId);

        const vectors = chunks.map((content, index) => ({
            id: `${assetId}_chunk_${index}`,
            values: embeddings[index],
            metadata: {
                assetId: asset.id,
                type: asset.type,
                filename: asset.name,
                chunkIndex: index,
                content: content.slice(0, 1000), // Store first 1000 chars for retrieval
            }
        }));

        // Batch upsert (Pinecone recommends batches of 100)
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await namespace.upsert(batch);
            console.log(`[RAG] Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
        }

        // 7. Also store in Prisma DocumentChunk for local backup/debugging
        console.log(`[RAG] Storing chunks in Prisma...`);
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

        // 8. Update asset status to READY
        await prisma.asset.update({
            where: { id: assetId },
            data: { status: 'READY' }
        });

        console.log(`[RAG] ========== Asset ${assetId} READY ==========`);
        return { success: true };

    } catch (error) {
        console.error(`[RAG] Error processing asset ${assetId}:`, error);

        // Mark asset as ERROR
        try {
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'ERROR' }
            });
        } catch (updateError) {
            console.error(`[RAG] Failed to update asset status:`, updateError);
        }

        return { success: false, error: String(error) };
    }
}

/**
 * Atomic delete function - removes asset from Blob, Pinecone, and Prisma.
 * Order: Blob → Pinecone → Prisma (to ensure no orphaned references)
 */
export async function deleteAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[RAG] ========== Deleting Asset: ${assetId} ==========`);

    try {
        // 1. Fetch asset to get URL and workshopId
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) {
            throw new Error(`Asset not found: ${assetId}`);
        }

        // 2. Delete from Vercel Blob
        console.log(`[RAG] Deleting from Blob: ${asset.url}`);
        try {
            await del(asset.url);
            console.log(`[RAG] Blob deleted`);
        } catch (blobError) {
            console.warn(`[RAG] Blob delete failed (may already be deleted):`, blobError);
        }

        // 3. Delete from Pinecone namespace
        console.log(`[RAG] Deleting from Pinecone namespace: ${asset.workshopId}`);
        try {
            const namespace = getWorkshopNamespace(asset.workshopId);

            // Get all chunk IDs for this asset
            const chunks = await prisma.documentChunk.findMany({
                where: { assetId },
                select: { chunkIndex: true }
            });

            const vectorIds = chunks.map(c => `${assetId}_chunk_${c.chunkIndex}`);

            if (vectorIds.length > 0) {
                await namespace.deleteMany(vectorIds);
                console.log(`[RAG] Deleted ${vectorIds.length} vectors from Pinecone`);
            }
        } catch (pineconeError) {
            console.warn(`[RAG] Pinecone delete failed:`, pineconeError);
        }

        // 4. Delete from Prisma (cascades to DocumentChunk via onDelete: Cascade)
        console.log(`[RAG] Deleting from Prisma...`);
        await prisma.asset.delete({
            where: { id: assetId }
        });

        console.log(`[RAG] ========== Asset ${assetId} DELETED ==========`);
        return { success: true };

    } catch (error) {
        console.error(`[RAG] Error deleting asset ${assetId}:`, error);
        return { success: false, error: String(error) };
    }
}
