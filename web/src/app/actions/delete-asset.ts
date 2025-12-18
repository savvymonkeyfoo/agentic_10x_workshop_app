'use server';

import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

/**
 * atomic asset deletion
 * 1. Delete from Vercel Blob
 * 2. Delete from Prisma
 * Prevents orphaned files.
 */
export async function deleteAsset(assetId: string) {
    if (!assetId) return { success: false, error: "Asset ID required" };

    try {
        // 1. Fetch asset to get URL
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) {
            return { success: false, error: "Asset not found" };
        }

        // 2. Delete from Vercel Blob (The Archive)
        // We await this to ensure we don't delete the DB record if Blob deletion fails significantly
        await del(asset.url);

        // 3. Delete from Database (The Registry)
        await prisma.asset.delete({
            where: { id: assetId }
        });

        revalidatePath(`/workshop/${asset.workshopId}/research`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return { success: false, error: "Delete failed" };
    }
}
