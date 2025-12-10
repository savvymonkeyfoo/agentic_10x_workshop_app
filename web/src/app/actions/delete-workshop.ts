'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function deleteWorkshop(id: string) {
    if (!id) {
        throw new Error('Workshop ID is required');
    }

    // Cascade delete opportunities handled by database or need manual cleanup?
    // Prisma schema doesn't show onDelete cascade for Opportunity relation in Workshop, 
    // but usually we want to delete related records first or use onDelete: Cascade in schema.
    // For now, let's assume simple delete, but if it fails due to foreign key constraint, 
    // we'll need to delete opportunities first.
    // Let's delete opportunities first to be safe.

    await prisma.opportunity.deleteMany({
        where: { workshopId: id }
    });

    await prisma.workshop.delete({
        where: { id }
    });

    revalidatePath('/');
}
