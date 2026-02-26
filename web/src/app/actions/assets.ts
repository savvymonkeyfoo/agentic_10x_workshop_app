'use server';

import { deleteAsset as deleteAssetService } from '@/lib/rag-service';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Delete an asset from all storage layers.
 * 
 * Atomically removes:
 * 1. Vercel Blob file
 * 2. Pinecone vectors (all chunks)
 * 3. Prisma Asset record + DocumentChunks
 * 
 * @param assetId - The ID of the asset to delete
 * @returns Result object with success status
 */
export async function deleteAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
    const result = await deleteAssetService(assetId);

    if (result.success) {
        // Revalidate the research page to reflect changes
        revalidatePath('/workshop/[id]/research', 'page');
    }

    return result;
}
