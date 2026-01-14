
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface DeletePromotedOpportunityOptions {
    opportunityId: string;
    workshopId: string;
}

/**
 * Deletes a PROMOTED opportunity from the SQL Opportunity table.
 * Use this for opportunities that have been promoted from ideation to capture.
 * 
 * For pre-promotion opportunities (still in JSON), use `deleteIdeationOpportunity` from context-engine.ts
 */
export async function deletePromotedOpportunity({ opportunityId, workshopId }: DeletePromotedOpportunityOptions) {
    if (!opportunityId) return { success: false, error: "Opportunity ID required" };

    try {
        await prisma.opportunity.delete({
            where: { id: opportunityId }
        });

        revalidatePath(`/workshop/${workshopId}/input`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete promoted opportunity:", error);
        return { success: false, error: "Delete failed" };
    }
}
