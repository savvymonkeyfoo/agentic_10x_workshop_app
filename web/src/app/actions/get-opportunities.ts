'use server';

import { prisma } from '@/lib/prisma';

export async function getOpportunities(workshopId: string) {
    if (!workshopId) return [];

    try {
        // CRITICAL FIX: Only return opportunities that have been promoted to Capture
        const opportunities = await prisma.opportunity.findMany({
            where: {
                workshopId,
                showInCapture: true  // Only show items that have been explicitly promoted
            },
            orderBy: { createdAt: 'asc' }  // Fixed order by creation time
        });
        return opportunities;
    } catch (error) {
        console.error("Failed to fetch opportunities for workshop:", workshopId, error);
        return [];
    }
}
