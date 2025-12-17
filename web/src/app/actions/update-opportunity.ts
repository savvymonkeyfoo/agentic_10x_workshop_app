"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateOpportunity(id: string, data: any) {
    try {
        const result = await prisma.opportunity.update({
            where: { id },
            data
        });
        revalidatePath(`/workshop/${result.workshopId}/reporting`);
        return { success: true, data: result };
    } catch (error) {
        console.error("Update failed", error);
        return { success: false, error };
    }
}
