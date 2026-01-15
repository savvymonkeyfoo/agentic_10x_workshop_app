'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * UNIFIED DELETE OPPORTUNITY ACTION
 * 
 * With unified SQL storage, there's only one delete function
 * that works for opportunities at any stage.
 */

interface DeleteOpportunityOptions {
    opportunityId: string;
    workshopId: string;
}

/**
 * Delete an opportunity from the database.
 * Works for opportunities at any stage (IDEATION, CAPTURE, etc.)
 */
export async function deleteOpportunity({ opportunityId, workshopId }: DeleteOpportunityOptions) {
    if (!opportunityId) {
        return { success: false, error: "Opportunity ID required" };
    }

    try {
        await prisma.opportunity.delete({
            where: { id: opportunityId }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to delete opportunity:", error);
        return { success: false, error: "Delete failed" };
    }
}

/**
 * Legacy function alias for backward compatibility
 */
export async function deletePromotedOpportunity(options: DeleteOpportunityOptions) {
    return deleteOpportunity(options);
}

/**
 * Legacy function alias for ideation deletions
 */
export async function deleteIdeationOpportunity(options: { workshopId: string; originalId: string }) {
    return deleteOpportunity({
        opportunityId: options.originalId,
        workshopId: options.workshopId
    });
}
