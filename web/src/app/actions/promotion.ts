'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { promotionSchema, validateData } from '@/lib/validation';

/**
 * UNIFIED PROMOTION ACTION
 * 
 * With unified SQL storage, promotion sets showInCapture = true
 * The item can optionally remain visible in ideation (showInIdeation stays true)
 */

interface PromoteOptions {
    workshopId: string;
    opportunityIds: string[];
    keepInIdeation?: boolean; // If true, item stays visible on whiteboard
}

export async function promoteToCapture(options: PromoteOptions) {
    try {
        // Validate input
        const validation = validateData(promotionSchema, options);
        if (!validation.success) {
            return {
                success: false,
                error: `Validation failed: ${validation.errors?.join(', ')}`
            };
        }

        const { workshopId, opportunityIds, keepInIdeation = true } = validation.data!;

        // Use transaction for atomicity
        const count = await prisma.$transaction(async (tx) => {
            // Set showInCapture = true (makes visible in Capture view)
            // Optionally keep showInIdeation = true (stays on whiteboard)
            const result = await tx.opportunity.updateMany({
                where: {
                    id: { in: opportunityIds },
                    workshopId
                },
                data: {
                    showInCapture: true,
                    showInIdeation: keepInIdeation,
                    promotionStatus: 'PROMOTED',
                    boardStatus: 'placed'
                }
            });
            return result.count;
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true, data: { count } };
    } catch (error) {
        console.error('Failed to promote opportunities:', error);
        return { success: false, error: 'Failed to promote opportunities' };
    }
}

/**
 * DEMOTE FROM CAPTURE
 * 
 * Reverses promotion by setting showInCapture = false
 * Items remain visible in Ideation
 */
export async function demoteFromCapture({ workshopId, opportunityIds }: { workshopId: string; opportunityIds: string[] }) {
    try {
        if (!workshopId || !opportunityIds || opportunityIds.length === 0) {
            return { success: false, error: 'Invalid arguments' };
        }

        const result = await prisma.opportunity.updateMany({
            where: {
                id: { in: opportunityIds },
                workshopId
            },
            data: {
                showInCapture: false,
                promotionStatus: null,  // Clear promoted status
            }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true, data: { count: result.count } };
    } catch (error) {
        console.error('Failed to demote opportunities:', error);
        return { success: false, error: 'Failed to demote opportunities' };
    }
}
