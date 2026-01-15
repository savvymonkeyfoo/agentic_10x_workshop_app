'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function promoteToCapture({ workshopId, opportunityIds, keepInIdeation = true }: PromoteOptions) {
    if (!workshopId || !opportunityIds || opportunityIds.length === 0) {
        return { success: false, count: 0 };
    }

    try {
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

        return { success: true, count: result.count };

    } catch (error) {
        console.error("Failed to promote opportunities", error);
        return { success: false, count: 0 };
    }
}

/**
 * Legacy function signature for backward compatibility
 * Maps the old interface to the new one
 */
export async function promoteOpportunities(
    workshopId: string,
    opportunities: Array<{ id?: string; originalId?: string }>
) {
    const ids = opportunities
        .map(o => o.id || o.originalId)
        .filter((id): id is string => !!id);

    return promoteToCapture({ workshopId, opportunityIds: ids });
}

/**
 * DEMOTE FROM CAPTURE
 * 
 * Reverses promotion by setting showInCapture = false
 * Items remain visible in Ideation
 */
export async function demoteFromCapture({ workshopId, opportunityIds }: { workshopId: string; opportunityIds: string[] }) {
    if (!workshopId || !opportunityIds || opportunityIds.length === 0) {
        return { success: false, count: 0 };
    }

    try {
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

        return { success: true, count: result.count };

    } catch (error) {
        console.error("Failed to demote opportunities", error);
        return { success: false, count: 0 };
    }
}
