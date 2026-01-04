'use server';

import { prisma } from '@/lib/prisma';

export async function getOpportunities(workshopId: string) {
    if (!workshopId) return [];

    try {
        const opportunities = await prisma.opportunity.findMany({
            where: { workshopId },
            orderBy: { updatedAt: 'desc' }
        });
        return opportunities;
    } catch (error) {
        console.error("Failed to fetch opportunities for workshop:", workshopId, error);
        return [];
    }
}
