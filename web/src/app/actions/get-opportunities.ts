'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getOpportunities(workshopId: string) {
    if (!workshopId) return [];

    try {
        const opportunities = await prisma.opportunity.findMany({
            where: { workshopId }
        });
        return opportunities;
    } catch (error) {
        console.error("Failed to fetch opportunities for workshop:", workshopId, error);
        return [];
    }
}
