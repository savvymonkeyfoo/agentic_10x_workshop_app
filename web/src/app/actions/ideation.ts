'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * UNIFIED SQL-BASED IDEATION ACTIONS
 * 
 * All ideation operations now use the Opportunity table with showInIdeation = true
 */

// Grid configuration for initial placement
const GRID = {
    COLUMNS: 3,
    CARD_WIDTH: 320,
    CARD_HEIGHT: 220,
    START_X: 50,
    START_Y: 50
};

/**
 * Initialize the ideation board by fetching opportunities with showInIdeation = true
 * and assigning grid positions to any that don't have them.
 */
export async function initializeIdeationBoard(workshopId: string) {
    try {
        // Fetch all opportunities visible in ideation view
        const opportunities = await prisma.opportunity.findMany({
            where: {
                workshopId,
                showInIdeation: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Assign positions to any that don't have them
        let hasUpdates = false;
        const positionedOpportunities = await Promise.all(
            opportunities.map(async (op, index) => {
                if (op.boardX === null || op.boardY === null) {
                    hasUpdates = true;
                    const col = index % GRID.COLUMNS;
                    const row = Math.floor(index / GRID.COLUMNS);

                    await prisma.opportunity.update({
                        where: { id: op.id },
                        data: {
                            boardX: GRID.START_X + (col * GRID.CARD_WIDTH),
                            boardY: GRID.START_Y + (row * GRID.CARD_HEIGHT),
                            boardStatus: op.boardStatus || 'inbox'
                        }
                    });

                    return {
                        ...op,
                        boardX: GRID.START_X + (col * GRID.CARD_WIDTH),
                        boardY: GRID.START_Y + (row * GRID.CARD_HEIGHT),
                        boardStatus: op.boardStatus || 'inbox'
                    };
                }
                return op;
            })
        );

        if (hasUpdates) {
            revalidatePath(`/workshop/${workshopId}`);
        }

        // Transform to format expected by UI
        const uiOpportunities = positionedOpportunities.map(op => ({
            id: op.id,
            originalId: op.originId || op.id,
            title: op.projectName,
            description: op.frictionStatement || '',
            proposedSolution: op.description || '',
            source: op.source || 'WORKSHOP_GENERATED',
            boardPosition: {
                x: op.boardX || 0,
                y: op.boardY || 0
            },
            boardStatus: op.boardStatus || 'inbox',
            friction: op.friction,
            techAlignment: op.techAlignment,
            strategyAlignment: op.strategyAlignment,
            tier: op.tier,
            promotionStatus: op.promotionStatus,
            showInIdeation: op.showInIdeation,
            showInCapture: op.showInCapture
        }));

        return { success: true, opportunities: uiOpportunities };

    } catch (error) {
        console.error("Failed to initialize board", error);
        return { success: false, error: "Failed to initialize" };
    }
}

/**
 * Update the X/Y position of an opportunity on the whiteboard
 */
export async function updateBoardPosition(
    workshopId: string,
    opportunityId: string,
    position: { x: number, y: number }
) {
    try {
        await prisma.opportunity.update({
            where: { id: opportunityId },
            data: {
                boardX: position.x,
                boardY: position.y
            }
        });

        // Don't revalidate to keep UI smooth (client state rules)
        return { success: true };

    } catch (error) {
        console.error("Failed to update position", error);
        return { success: false };
    }
}

/**
 * Create a new opportunity visible in IDEATION view
 */
export async function createWorkshopOpportunity(
    workshopId: string,
    cardData: {
        title?: string;
        description?: string;
        proposedSolution?: string;
        friction?: string;
        techAlignment?: string;
        strategyAlignment?: string;
    }
) {
    try {
        // Get count of existing ideation opportunities for positioning
        const existingCount = await prisma.opportunity.count({
            where: { workshopId, showInIdeation: true }
        });

        const col = existingCount % GRID.COLUMNS;
        const row = Math.floor(existingCount / GRID.COLUMNS);

        const newOpportunity = await prisma.opportunity.create({
            data: {
                workshopId,
                showInIdeation: true,  // Visible on whiteboard
                showInCapture: false,  // Not yet promoted to capture
                projectName: cardData.title || 'Untitled Idea',
                frictionStatement: cardData.description || '',
                description: cardData.proposedSolution || '',
                friction: cardData.friction,
                techAlignment: cardData.techAlignment,
                strategyAlignment: cardData.strategyAlignment,
                source: 'WORKSHOP_GENERATED',
                boardX: GRID.START_X + (col * GRID.CARD_WIDTH),
                boardY: GRID.START_Y + (row * GRID.CARD_HEIGHT),
                boardStatus: 'inbox',
                // Required defaults
                whyDoIt: '',
                strategicHorizon: '',
                scoreValue: 0,
                scoreCapability: 0,
                scoreComplexity: 0,
                tShirtSize: 'M',
                definitionOfDone: '',
                keyDecisions: ''
            }
        });

        revalidatePath(`/workshop/${workshopId}`);

        // Return in UI format
        return {
            success: true,
            opportunity: {
                id: newOpportunity.id,
                originalId: newOpportunity.id,
                title: newOpportunity.projectName,
                description: newOpportunity.frictionStatement,
                proposedSolution: newOpportunity.description,
                source: newOpportunity.source,
                boardPosition: {
                    x: newOpportunity.boardX,
                    y: newOpportunity.boardY
                },
                boardStatus: newOpportunity.boardStatus,
                showInIdeation: newOpportunity.showInIdeation,
                showInCapture: newOpportunity.showInCapture
            }
        };

    } catch (error) {
        console.error("Failed to create workshop opportunity", error);
        return { success: false, error: "Failed to create" };
    }
}

/**
 * Delete an ideation opportunity
 */
export async function deleteIdeationOpportunity(opportunityId: string, workshopId: string) {
    try {
        await prisma.opportunity.delete({
            where: { id: opportunityId }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete ideation opportunity", error);
        return { success: false };
    }
}
