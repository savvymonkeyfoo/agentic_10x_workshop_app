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
