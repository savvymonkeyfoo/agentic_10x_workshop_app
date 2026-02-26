'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { deleteWorkshopSchema } from '@/lib/validation';

export async function deleteWorkshop(id: string) {
    // Validate input
    const validation = deleteWorkshopSchema.safeParse({ id });
    if (!validation.success) {
        const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Validation failed: ${errors}`);
    }

    // Use transaction to ensure atomic delete
    await prisma.$transaction(async (tx) => {
        // 1. Delete all related opportunities (and their cascading relations)
        await tx.opportunity.deleteMany({
            where: { workshopId: id }
        });

        // 2. Delete workshop context if exists
        const context = await tx.workshopContext.findUnique({
            where: { workshopId: id }
        });
        if (context) {
            await tx.workshopContext.delete({
                where: { id: context.id }
            });
        }

        // 3. Delete all assets and their chunks (CASCADE handled by schema)
        await tx.asset.deleteMany({
            where: { workshopId: id }
        });

        // 4. Finally delete the workshop
        await tx.workshop.delete({
            where: { id }
        });
    });

    revalidatePath('/');
}
