'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { deleteOpportunitySchema } from '@/lib/validation';

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
    // Validate input
    const validation = deleteOpportunitySchema.safeParse({ opportunityId, workshopId });
    if (!validation.success) {
        const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, error: errors };
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
