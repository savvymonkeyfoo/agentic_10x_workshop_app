'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { safeAction } from '@/lib/safe-action';

/**
 * UNIFIED PROMOTION ACTION
 * 
 * With unified SQL storage, promotion sets showInCapture = true
 * The item can optionally remain visible in ideation (showInIdeation stays true)
 */

interface PromoteOptions {
    workshopId: string;
    opportunityIds: string[];
    keepInIdeation?: boolean; // If true, item stays visible on whiteboard
}

export async function promoteToCapture(options: PromoteOptions) {
    return await safeAction(async () => {
        const { workshopId, opportunityIds, keepInIdeation = true } = options;
        if (!workshopId || !opportunityIds || opportunityIds.length === 0) {
            throw new Error('Invalid arguments');
        }

        // Set showInCapture = true (makes visible in Capture view)
        // Optionally keep showInIdeation = true (stays on whiteboard)
        const result = await prisma.opportunity.updateMany({
            where: {
                id: { in: opportunityIds },
                workshopId
            },
            data: {
                showInCapture: true,
                showInIdeation: keepInIdeation,
                promotionStatus: 'PROMOTED',
                boardStatus: 'placed'
            }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { count: result.count };
    }, 'Failed to promote opportunities');
}

/**
 * DEMOTE FROM CAPTURE
 * 
 * Reverses promotion by setting showInCapture = false
 * Items remain visible in Ideation
 */
export async function demoteFromCapture({ workshopId, opportunityIds }: { workshopId: string; opportunityIds: string[] }) {
    return await safeAction(async () => {
        if (!workshopId || !opportunityIds || opportunityIds.length === 0) {
            throw new Error('Invalid arguments');
        }

        const result = await prisma.opportunity.updateMany({
            where: {
                id: { in: opportunityIds },
                workshopId
            },
            data: {
                showInCapture: false,
                promotionStatus: null,  // Clear promoted status
            }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { count: result.count };
    }, 'Failed to demote opportunities');
}
