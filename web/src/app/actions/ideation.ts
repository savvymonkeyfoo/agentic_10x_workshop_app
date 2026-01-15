'use server';

import { prisma } from '@/lib/prisma';
import { UnifiedOpportunity } from '@/types/opportunity';
import { revalidatePath } from 'next/cache';

export async function initializeIdeationBoard(workshopId: string) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        // @ts-ignore
        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        const opportunities: UnifiedOpportunity[] = (currentData.opportunities || []) as UnifiedOpportunity[];

        let hasUpdates = false;

        // GRID CONFIGURATION
        const COLUMNS = 3;
        const CARD_WIDTH = 320; // Approx card width + gap
        const CARD_HEIGHT = 220; // Approx card height + gap
        const START_X = 50;
        const START_Y = 50;

        const updatedOpportunities = opportunities.map((op, index) => {
            if (!op.boardPosition) {
                hasUpdates = true;

                // GRID CALCULATION
                const col = index % COLUMNS;
                const row = Math.floor(index / COLUMNS);

                return {
                    ...op,
                    boardStatus: 'inbox',
                    boardPosition: {
                        x: START_X + (col * CARD_WIDTH),
                        y: START_Y + (row * CARD_HEIGHT)
                    }
                };
            }
            return op;
        });

        if (hasUpdates) {
            await prisma.workshopContext.update({
                where: { workshopId },
                data: {
                    intelligenceAnalysis: {
                        ...currentData,
                        opportunities: updatedOpportunities
                    }
                }
            });
            revalidatePath(`/workshop/${workshopId}`);
        }

        return { success: true, opportunities: updatedOpportunities };

    } catch (error) {
        console.error("Failed to initialize board", error);
        return { success: false, error: "Failed to initialize" };
    }
}

export async function updateBoardPosition(
    workshopId: string,
    opportunityId: string,
    position: { x: number, y: number }
) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        // @ts-ignore
        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        const opportunities: UnifiedOpportunity[] = (currentData.opportunities || []) as UnifiedOpportunity[];

        const updatedOpportunities = opportunities.map(op => {
            if (op.originalId === opportunityId) {
                return { ...op, boardPosition: position };
            }
            return op;
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

        // We do NOT revalidatePath here to keep the UI smooth (Client State rules)
        return { success: true };

    } catch (error) {
        console.error("Failed to update position", error);
        return { success: false };
    }
}

export async function createWorkshopOpportunity(
    workshopId: string,
    cardData: Partial<UnifiedOpportunity>
) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        // @ts-ignore
        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        const opportunities: UnifiedOpportunity[] = (currentData.opportunities || []) as UnifiedOpportunity[];

        // GRID CALCULATION FIND FIRST EMPTY SLOT OR APPEND
        const COLUMNS = 3;
        const CARD_WIDTH = 320;
        const CARD_HEIGHT = 220;
        const START_X = 50;
        const START_Y = 50;

        // Simply append to the end of the grid logic
        const nextIndex = opportunities.length;
        const col = nextIndex % COLUMNS;
        const row = Math.floor(nextIndex / COLUMNS);

        const newOpportunity: UnifiedOpportunity = {
            id: `work-${Date.now()}`,
            originalId: `work-${Date.now()}`,
            title: cardData.title || "Untitled Idea",
            description: cardData.description || "",
            proposedSolution: cardData.proposedSolution, // Map Solution
            source: "WORKSHOP_GENERATED",
            boardStatus: 'inbox',
            boardPosition: {
                x: START_X + (col * CARD_WIDTH),
                y: START_Y + (row * CARD_HEIGHT)
            },
            friction: cardData.friction,
            techAlignment: cardData.techAlignment,
            strategyAlignment: cardData.strategyAlignment,
        };

        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: {
                    ...currentData,
                    opportunities: [...opportunities, newOpportunity]
                }
            }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true, opportunity: newOpportunity };

    } catch (error) {
        console.error("Failed to create workshop opportunity", error);
        return { success: false, error: "Failed to create" };
    }
}

export async function syncIdeationWithCapture(workshopId: string) {
    try {
        // 1. Get Promoted Opportunities (Source of Truth)
        const promotedOpps = await prisma.opportunity.findMany({
            where: { workshopId }
        });

        if (!promotedOpps.length) {
            return { success: true, count: 0, message: "No promoted items to sync." };
        }

        // 2. Get Ideation Board JSON
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        // @ts-ignore
        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        const opportunities: UnifiedOpportunity[] = (currentData.opportunities || []) as UnifiedOpportunity[];

        // Map for quick lookup
        const ideationMap = new Map(opportunities.map(o => [o.originalId, o]));
        let hasUpdates = false;

        // 3. Process Sync
        const restoredOpportunities = [...opportunities];

        for (const pOpp of promotedOpps) {
            const originId = pOpp.originId || pOpp.id;

            if (ideationMap.has(originId)) {
                // EXISTS: Ensure status is PROMOTED
                const existing = ideationMap.get(originId);
                if (existing && existing.promotionStatus !== 'PROMOTED') {
                    // Update in place (modifying the object in the array reference)
                    existing.promotionStatus = 'PROMOTED';
                    hasUpdates = true;
                }
            } else {
                // MISSING: Restore it
                hasUpdates = true;
                restoredOpportunities.push({
                    id: pOpp.id, // Re-use the SQL ID if possible, or fallback
                    originalId: originId,
                    title: pOpp.projectName || "Untitled Restored Item",
                    description: pOpp.frictionStatement || "", // Map back friction to description
                    source: "WORKSHOP_GENERATED", // Default as we lost the original source
                    boardStatus: 'placed',
                    promotionStatus: 'PROMOTED',
                    // Let initializeIdeationBoard handle positions later if needed
                    // But to be safe, we can put them in a harmless spot or let user organize
                } as UnifiedOpportunity);
            }
        }

        if (hasUpdates) {
            await prisma.workshopContext.update({
                where: { workshopId },
                data: {
                    intelligenceAnalysis: {
                        ...currentData,
                        opportunities: restoredOpportunities
                    }
                }
            });
            revalidatePath(`/workshop/${workshopId}`);
            return { success: true, count: promotedOpps.length, message: "Sync complete. Missing items restored." };
        }

        return { success: true, count: 0, message: "Already in sync." };

    } catch (error) {
        console.error("Sync Failed", error);
        return { success: false, error: "Failed to sync" };
    }
}
