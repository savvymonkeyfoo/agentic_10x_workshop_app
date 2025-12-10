
'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function deleteOpportunity(id: string, workshopId: string) {
    if (!id) return { success: false, error: "ID required" };

    try {
        await prisma.opportunity.delete({
            where: { id }
        });

        revalidatePath(`/workshop/${workshopId}/input`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete opportunity:", error);
        return { success: false, error: "Delete failed" };
    }
}
