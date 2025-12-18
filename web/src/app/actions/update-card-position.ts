'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Update the X/Y position of an IdeaCard on the whiteboard canvas.
 * Called after drag-end events to persist spatial layout.
 */
export async function updateCardPosition(
    cardId: string,
    xPosition: number,
    yPosition: number
) {
    try {
        await prisma.ideaCard.update({
            where: { id: cardId },
            data: {
                xPosition,
                yPosition
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update card position:', error);
        return { success: false, error: 'Failed to update position' };
    }
}
