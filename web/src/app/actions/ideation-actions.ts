'use server';

import { prisma } from '@/lib/prisma';
import { UnifiedOpportunity } from '@/types/opportunity';
import { revalidatePath } from 'next/cache';

// =============================================================================
// INITIALIZATION (HANDOVER LOGIC)
// =============================================================================

export async function initializeIdeationBoard(workshopId: string) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        let opportunities = (currentData.opportunities || []) as UnifiedOpportunity[];
        let hasChanges = false;
        let inboxIndex = 0; // Counter for stacking offset

        // 1. ITERATE & MIGRATE
        opportunities = opportunities.map((opp) => {
            // IDEMPOTENCY CHECK: If position exists, DO NOT TOUCH.
            if (opp.boardPosition && opp.boardPosition.x !== undefined) {
                return opp;
            }

            // MIGRATION: Assign Default "Inbox" Coordinates
            hasChanges = true;

            // CASCADE FORMULA: x: 50 + (i * 5), y: 50 + (i * 5)
            const offsetX = 50 + (inboxIndex * 5);
            const offsetY = 50 + (inboxIndex * 5);
            inboxIndex++; // Increment for next item

            return {
                ...opp,
                // Ensure we have a valid ID for the board (originalId is the DB key, but UI needs 'id')
                id: opp.id || opp.originalId || `gen-${Date.now()}-${inboxIndex}`,
                boardPosition: { x: offsetX, y: offsetY },
                boardStatus: 'inbox',
                tier: opp.tier || 'UNSCORED'
            };
        });

        // 2. SAVE ONLY IF NEEDED
        if (hasChanges) {
            await prisma.workshopContext.update({
                where: { workshopId },
                data: {
                    intelligenceAnalysis: {
                        ...currentData,
                        opportunities
                    }
                }
            });
            revalidatePath(`/workshop/${workshopId}`);
            return { success: true, migratedCount: inboxIndex };
        }

        return { success: true, migratedCount: 0 };

    } catch (error) {
        console.error("Failed to initialize board", error);
        return { success: false, error: "Failed to initialize board" };
    }
}

// =============================================================================
// PERSISTENCE (SPATIAL UPDATES)
// =============================================================================

export async function updateBoardPosition(
    workshopId: string,
    opportunityId: string,
    position: { x: number; y: number }
) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        const opportunities = (currentData.opportunities || []) as UnifiedOpportunity[];

        // LIGHTWEIGHT UPDATE: Only touch x/y
        const updatedOpportunities = opportunities.map(opp => {
            if (opp.originalId === opportunityId || opp.id === opportunityId) {
                return {
                    ...opp,
                    boardPosition: position,
                    boardStatus: 'placed' // Once moved, it's "placed"
                };
            }
            return opp;
        });

        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: {
                    ...currentData,
                    opportunities: updatedOpportunities
                }
            }
        });

        // No revalidate needed for silent save? 
        // Ideally yes, to keep server state fresh for other users.
        revalidatePath(`/workshop/${workshopId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update position", error);
        return { success: false };
    }
}
