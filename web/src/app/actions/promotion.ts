'use server';

import { prisma } from '@/lib/prisma';
import { UnifiedOpportunity } from '@/types/opportunity';
import { revalidatePath } from 'next/cache';

// Force schema sync check

export async function promoteToCapture(workshopId: string, opportunities: UnifiedOpportunity[]) {
    if (!workshopId || !opportunities || opportunities.length === 0) return { success: false, count: 0 };

    let promotedCount = 0;
    const promotedIds: string[] = [];

    // 1. Promote to SQL
    for (const opp of opportunities) {
        const originId = opp.originalId;
        if (!originId || originId === 'draft') continue;

        // Idempotency: Check if already promoted
        const existing = await prisma.opportunity.findFirst({
            where: { originId: originId }
        });

        if (existing) {
            promotedIds.push(originId);
            continue;
        }

        try {
            await prisma.opportunity.create({
                data: {
                    workshopId,
                    projectName: opp.title,
                    description: opp.proposedSolution || '', // Map Proposed Solution to Description
                    // Map Problem (ideation.description) to Friction Statement.
                    frictionStatement: opp.description || opp.friction || '',
                    whyDoIt: '',

                    // Rich Intelligence Fields
                    friction: opp.friction,
                    techAlignment: opp.techAlignment,
                    strategyAlignment: opp.strategyAlignment,
                    strategicHorizon: '',

                    // Lineage
                    originId: originId,
                    promotionStatus: 'PROMOTED',

                    // Defaults for required fields
                    scoreValue: 0,
                    scoreCapability: 0,
                    scoreComplexity: 0,
                    tShirtSize: 'M',
                    definitionOfDone: '',
                    keyDecisions: '',

                    // Defaults for array/json fields
                    workflowPhases: [],
                    capabilitiesExisting: [],
                    capabilitiesMissing: []
                }
            });
            promotedCount++;
            promotedIds.push(originId);
        } catch (error) {
            console.error(`Failed to promote opportunity ${originId}`, error);
        }
    }

    // 2. Update Source JSON (Visual Lock)
    if (promotedIds.length > 0) {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentData = (context?.intelligenceAnalysis as any) || { opportunities: [] };
        const storedOpps = (currentData.opportunities || []) as UnifiedOpportunity[];

        let hasUpdates = false;
        const updatedOpps = storedOpps.map(op => {
            if (promotedIds.includes(op.originalId)) {
                // Mark as promoted
                if (op.promotionStatus !== 'PROMOTED') {
                    hasUpdates = true;
                    return { ...op, promotionStatus: 'PROMOTED', boardStatus: 'placed' };
                }
            }
            return op;
        });

        if (hasUpdates) {
            await prisma.workshopContext.update({
                where: { workshopId },
                data: {
                    intelligenceAnalysis: {
                        ...currentData,
                        opportunities: updatedOpps
                    }
                }
            });
            revalidatePath(`/workshop/${workshopId}`);
        }
    }

    return { success: true, count: promotedCount };
}
