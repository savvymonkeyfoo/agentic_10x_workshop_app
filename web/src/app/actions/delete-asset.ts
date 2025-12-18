'use server';

import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getWorkshopNamespace } from '@/lib/pinecone';

/**
 * Atomic Asset Deletion
 * 
 * Removes asset from all storage layers:
 * 1. Vercel Blob (file storage)
 * 2. Pinecone (vector embeddings)
 * 3. Prisma (database record + chunks)
 * 
 * Order ensures no orphaned references.
 */
export async function deleteAsset(assetId: string) {
    if (!assetId) return { success: false, error: "Asset ID required" };

    console.log(`[deleteAsset] Starting atomic delete for: ${assetId}`);

    try {
        // 1. Fetch asset to get URL and workshopId
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) {
            return { success: false, error: "Asset not found" };
        }

        // 2. Delete from Vercel Blob
        console.log(`[deleteAsset] Deleting from Blob: ${asset.url}`);
        try {
            await del(asset.url);
        } catch (blobError) {
            console.warn(`[deleteAsset] Blob delete failed (may already be deleted):`, blobError);
        }

        // 3. Delete from Pinecone (all chunks for this asset)
        console.log(`[deleteAsset] Deleting from Pinecone namespace: ${asset.workshopId}`);
        try {
            const namespace = getWorkshopNamespace(asset.workshopId);

            // Get chunk count from Prisma to build vector IDs
            const chunks = await prisma.documentChunk.findMany({
                where: { assetId },
                select: { chunkIndex: true }
            });

            if (chunks.length > 0) {
                const vectorIds = chunks.map(c => `${assetId}_chunk_${c.chunkIndex}`);
                await namespace.deleteMany(vectorIds);
                console.log(`[deleteAsset] Deleted ${vectorIds.length} vectors`);
            }
        } catch (pineconeError) {
            console.warn(`[deleteAsset] Pinecone delete failed:`, pineconeError);
            // Continue with Prisma deletion even if Pinecone fails
        }

        // 4. Delete from Prisma (cascades to DocumentChunk via onDelete: Cascade)
        console.log(`[deleteAsset] Deleting from Prisma...`);
        await prisma.asset.delete({
            where: { id: assetId }
        });

        console.log(`[deleteAsset] Complete for: ${assetId}`);
        revalidatePath(`/workshop/${asset.workshopId}/research`);
        return { success: true };

    } catch (error) {
        console.error("[deleteAsset] Failed:", error);
        return { success: false, error: "Delete failed" };
    }
}
