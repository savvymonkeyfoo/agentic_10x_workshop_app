"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { updateOpportunitySchema } from '@/lib/validation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateOpportunity(id: string, data: any) {
    // Validate input
    const validation = updateOpportunitySchema.safeParse(data);
    if (!validation.success) {
        const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return {
            success: false,
            error: `Validation failed: ${errors}`
        };
    }

    try {
        const result = await prisma.opportunity.update({
            where: { id },
            data: validation.data
        });
        revalidatePath(`/workshop/${result.workshopId}/reporting`);
        return { success: true, data: result };
    } catch (error) {
        console.error("Update failed", error);
        return { success: false, error: "Update failed" };
    }
}
